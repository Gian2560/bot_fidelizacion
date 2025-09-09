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

    console.log(`📞 Celulares para consultar: ${celulares.split(',').length}`);

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
          if (row.telefono && row.fecha_ultimo_pago) {
            // Convertir telefono a string para hacer match con JavaScript
            fechasUltimoPago[row.telefono.toString()] = new Date(row.fecha_ultimo_pago);
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
        // Sin registro de pago, verificar si la promesa está vencida
        esIncumplida = fechaPromesa < ahora;
      } else {
        // Con registro de pago, verificar si pagó después de la promesa
        esIncumplida = fechaPromesa < ahora && fechaUltimoPago < fechaPromesa;
      }

      if (esIncumplida) {
        const diasVencido = Math.floor((ahora - fechaPromesa) / (1000 * 60 * 60 * 24));
        
        promesasIncumplidas.push({
          id: cliente.cliente_id,
          clienteId: cliente.cliente_id,
          cliente: cliente.nombre,
          telefono: cliente.celular,
          documento: cliente.documento_identidad,
          fechaPromesa: fechaPromesa.toLocaleDateString('es-ES'),
          fechaUltimoPago: fechaUltimoPago?.toLocaleDateString('es-ES') || 'Sin registro',
          diasVencido: diasVencido,
          monto: parseFloat(cliente.monto) || 0,
          gestor: cliente.gestor || 'Sin asignar',
          motivoCita: ultimaCita.motivo || 'Sin motivo',
          estadoCita: ultimaCita.estado_cita || 'Sin estado'
        });

        if (index < 3) {
          console.log(`- ✅ Promesa incumplida: ${diasVencido} días vencida`);
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
