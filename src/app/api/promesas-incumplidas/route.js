import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bq from '@/lib/bigquery';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const offset = (page - 1) * limit;

    console.log('📊 Consultando promesas de pago incumplidas...');

    // 🔍 Paso 1: Obtener clientes con citas de promesa de pago
    let clientesConPromesas = [];
    
    try {
      console.log('🔄 Consultando clientes con citas...');
      
      // Consulta simplificada sin filtros problemáticos
      clientesConPromesas = await prisma.cliente.findMany({
        where: {
          celular: {
            not: null,
            not: ''
          },
          cita: {
            some: {}  // Al menos una cita debe existir
          }
        },
        
        include: {
          cita: {
            orderBy: {
              fecha_cita: 'desc'
            }
          }
        },
      });
      console.log(`✅ Clientes con citas obtenidos: ${clientesConPromesas.length}`);

      // Filtrar clientes que tienen citas válidas con fecha no nula
      clientesConPromesas = clientesConPromesas.filter(cliente => 
        cliente.cita && 
        cliente.cita.length > 0 && 
        cliente.cita.some(cita => cita.fecha_cita !== null && cita.fecha_cita !== undefined)
      );

      console.log(`✅ Clientes con citas encontrados: ${clientesConPromesas.length}`);

    } catch (prismaError) {
      console.log('❌ Error en PostgreSQL:', prismaError?.message || 'Error desconocido');
      return NextResponse.json(
        {
          success: false,
          error: 'Error en base de datos',
          message: prismaError?.message || 'Error desconocido'
        },
        { status: 500 }
      );
    }

    if (clientesConPromesas.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    }

    // 🔍 Paso 2: Extraer celulares para BigQuery (normalizando el formato)
    const celulares = clientesConPromesas
      .map(cliente => {
        const celular = cliente.celular;
        if (!celular) return null;
        
        // Normalizar: remover +51 si existe para hacer match con BigQuery
        const celularNormalizado = celular.replace(/^\+51/, '').trim();
        return celularNormalizado;
      })
      .filter(cel => cel && cel !== '' && !isNaN(cel)) // Validar que sea número
      .join(','); // Sin comillas porque BigQuery espera INT64

    console.log(`📞 Celulares para consultar: ${celulares}`);

    // 🔍 Paso 3: Consultar BigQuery para fechas de último pago
    let fechasUltimoPago = {};
    
    if (celulares.length > 0) {
      try {
        console.log('🔄 Consultando BigQuery...');
        
        const bigQueryQuery = `
          SELECT 
            Telf_SMS as telefono,
            \`Fec_Ult_Pag_CCAP\` as fecha_ultimo_pago
          FROM \`peak-emitter-350713.FR_general.bd_fondos\`
          WHERE Telf_SMS IN (${celulares})
            AND \`Fec_Ult_Pag_CCAP\` IS NOT NULL
          LIMIT 1000
        `;

        const [results] = await bq.query({
          query: bigQueryQuery,
          location: 'US'
        });

        // Crear mapa de fechas de último pago por teléfono
        results.forEach(row => {
          console.log(`🔍 BigQuery row:`, {
            telefono: row.telefono,
            fecha_ultimo_pago: row.fecha_ultimo_pago,
            tipo_fecha: typeof row.fecha_ultimo_pago
          });
          
          if (row.telefono && row.fecha_ultimo_pago) {
            // Extraer el valor de BigQueryDatetime si es un objeto
            let fechaValue = row.fecha_ultimo_pago;
            if (typeof fechaValue === 'object' && fechaValue.value) {
              fechaValue = fechaValue.value;
            }
            
            const fechaPago = new Date(fechaValue);
            
            // Validar que la fecha sea válida
            if (!isNaN(fechaPago.getTime())) {
              fechasUltimoPago[row.telefono.toString()] = fechaPago;
              console.log(`✅ Fecha válida guardada para ${row.telefono}: ${fechaPago.toLocaleDateString('es-ES')}`);
            } else {
              console.log(`❌ Fecha inválida para ${row.telefono}:`, fechaValue);
            }
          }
        });

        console.log(`✅ BigQuery: ${results.length} registros, ${Object.keys(fechasUltimoPago).length} fechas válidas`);

      } catch (bigQueryError) {
        console.log('⚠️ Error en BigQuery, continuando sin datos de pago:', bigQueryError?.message);
      }
    }

    // 🔍 Paso 4: Procesar promesas incumplidas
    const promesasIncumplidas = [];
    const ahora = new Date();

    clientesConPromesas.forEach((cliente, index) => {
      if (index < 3) {
        console.log(`Procesando cliente: ${cliente.nombre} (${cliente.cita.length} citas)`);
      }

      // Obtener la cita más reciente
      const ultimaCita = cliente.cita[0]; // Ya están ordenadas por fecha desc
      
      if (!ultimaCita || !ultimaCita.fecha_cita) {
        return;
      }

      const fechaPromesa = new Date(ultimaCita.fecha_cita);
      
      // Normalizar celular del cliente para hacer match con BigQuery
      const celularNormalizado = cliente.celular ? cliente.celular.replace(/^\+51/, '').trim() : '';
      const fechaUltimoPago = fechasUltimoPago[celularNormalizado];

      // Verificar si está incumplida
      let esIncumplida = false;
      
      if (!fechaUltimoPago) {
        // Sin registro de pago en BigQuery, verificar si la fecha de promesa ya pasó
        const hoy = new Date();
        esIncumplida = fechaPromesa < hoy;
        
        if (index < 3) {
          console.log(`- Sin registro de pago en BigQuery`);
          console.log(`- Fecha promesa: ${fechaPromesa.toLocaleDateString('es-ES')}`);
          console.log(`- Fecha hoy: ${hoy.toLocaleDateString('es-ES')}`);
          console.log(`- Promesa ya pasó: ${fechaPromesa < hoy ? 'SÍ' : 'NO'}`);
          console.log(`- Estado: ${esIncumplida ? 'INCUMPLIDA' : 'AÚN NO VENCIDA'}`);
        }
      } else {
        // Con registro de pago, verificar si pagó en el mismo mes de la promesa o después
        const mesPromesa = fechaPromesa.getMonth();
        const añoPromesa = fechaPromesa.getFullYear();
        const mesPago = fechaUltimoPago.getMonth();
        const añoPago = fechaUltimoPago.getFullYear();
        
        // Está CUMPLIDA si pagó en el mismo mes/año o después
        const pagoEnMismoMesOPosterior = (añoPago > añoPromesa) || 
                                       (añoPago === añoPromesa && mesPago >= mesPromesa);
        
        if (pagoEnMismoMesOPosterior) {
          esIncumplida = false; // CUMPLIDA
        } else {
          // Pago anterior al mes de la promesa, verificar si la promesa ya venció
          const hoy = new Date();
          esIncumplida = fechaPromesa < hoy;
        }
        
        if (index < 3) {
          console.log(`- Fecha promesa: ${fechaPromesa.toLocaleDateString('es-ES')} (${mesPromesa + 1}/${añoPromesa})`);
          console.log(`- Fecha último pago: ${fechaUltimoPago.toLocaleDateString('es-ES')} (${mesPago + 1}/${añoPago})`);
          console.log(`- Pagó en mismo mes o posterior: ${pagoEnMismoMesOPosterior ? 'SÍ' : 'NO'}`);
          console.log(`- Estado: ${esIncumplida ? 'INCUMPLIDA' : 'CUMPLIDA'}`);
        }
      }

      if (esIncumplida) {
        const hoy = new Date();
        const diasVencido = Math.floor((hoy - fechaPromesa) / (1000 * 60 * 60 * 24));
        
        promesasIncumplidas.push({
          id: cliente.cliente_id,
          clienteId: cliente.cliente_id,
          cliente: cliente.nombre,
          telefono: cliente.celular,
          documento: cliente.documento_identidad,
          fechaPromesa: fechaPromesa.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }),
          fechaUltimoPago: fechaUltimoPago 
            ? fechaUltimoPago.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })
            : 'Sin pago registrado',
          diasVencido: Math.max(0, diasVencido),
          monto: parseFloat(cliente.monto) || 0,
          gestor: cliente.gestor || 'Sin asignar',
          motivoCita: ultimaCita.motivo || 'Sin motivo',
          estadoCita: ultimaCita.estado_cita || 'Sin estado'
        });

        if (index < 3) {
          console.log(`- ✅ Promesa incumplida agregada`);
        }
      }
    });

    console.log(`🔍 Total promesas incumplidas: ${promesasIncumplidas.length}`);

    // 🔍 Paso 5: Aplicar paginación
    const totalItems = promesasIncumplidas.length;
    const paginatedData = promesasIncumplidas
      .sort((a, b) => b.diasVencido - a.diasVencido)
      .slice(offset, offset + limit);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      totalItems: totalItems,
      hasNextPage: page < Math.ceil(totalItems / limit),
      hasPrevPage: page > 1
    };

    console.log(`✅ Enviando ${paginatedData.length} registros de ${totalItems} total`);

    return NextResponse.json({
      success: true,
      data: paginatedData,
      pagination: pagination
    });

  } catch (error) {
    console.log('❌ Error general:', error?.message || 'Error desconocido');
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        message: error?.message || 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
