import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const gestor = searchParams.get('gestor'); // Username del gestor
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');

    // 📅 Validación de fechas requeridas
    if (!fechaDesde || !fechaHasta) {
      return NextResponse.json(
        { error: "Debe proporcionar fecha de inicio y fin" },
        { status: 400 }
      );
    }

    // 🔍 Construir filtros base para acciones comerciales (estas son las "llamadas")
    const filtroBase = {
      fecha_accion: {
        gte: new Date(fechaDesde),
        lte: new Date(fechaHasta + 'T23:59:59.999Z'), // Incluir todo el día final
      },
    };
    console.log("🔄 Filtro base:", gestor);
    
    // 👤 Agregar filtro por gestor si se especifica
    if (gestor && gestor !== 'todos' && gestor !== '' && !isNaN(parseInt(gestor))) {
      // Filtrar por el campo gestor que contiene el username
      const gestorCon = await prisma.usuario.findUnique({
        where: { usuario_id: parseInt(gestor) },
        select: { username: true }
      });
      
      if (gestorCon) {
        console.log(`Filtrando por gestor: ${gestorCon.username}`);
        filtroBase.gestor = gestorCon.username;
      } else {
        console.log("⚠️ Gestor no encontrado:", gestor);
      }
    } else {
      console.log("📊 Consultando todos los gestores");
    }

    // 📊 Obtener estadísticas principales de acciones comerciales
    const [
      totalLlamadas,
      llamadasHoy,
      accionesPorEstado,
      actividadDiaria,
      clientesContactados,
    ] = await Promise.all([
      // Total de acciones comerciales (llamadas)
      prisma.accion_comercial.count({ where: filtroBase }),
      
      // Acciones del día actual
      prisma.accion_comercial.count({
        where: {
          ...filtroBase,
          fecha_accion: {
            gte: new Date(new Date().toISOString().split('T')[0]),
            lte: new Date(),
          }
        }
      }),
      
      // Distribución por estado de las acciones comerciales
      prisma.accion_comercial.groupBy({
        by: ['estado'],
        _count: {
          accion_comercial_id: true,
        },
        where: filtroBase,
      }),
      
      // Actividad diaria (últimos 7 días o en el rango especificado)
      prisma.accion_comercial.groupBy({
        by: ['fecha_accion'],
        _count: {
          accion_comercial_id: true,
        },
        where: {
          ...filtroBase,
          fecha_accion: {
            gte: new Date(Math.max(new Date(fechaDesde), new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))),
            lte: new Date(fechaHasta + 'T23:59:59.999Z'),
          }
        },
        orderBy: {
          fecha_accion: 'asc',
        },
      }),
      
      // Clientes únicos contactados (que tienen al menos una acción comercial)
      prisma.accion_comercial.groupBy({
        by: ['cliente_id'],
        where: filtroBase,
      }).then(grouped => grouped.length),
    ]);

    // 🔍 Debug: Ver qué estados se encontraron en la base de datos
    console.log("🔍 Estados encontrados en accion_comercial:", 
      accionesPorEstado.map(item => `"${item.estado}": ${item._count.accion_comercial_id}`)
    );
    console.log("🔍 Total de acciones comerciales encontradas:", totalLlamadas);

    // 📈 Calcular métricas derivadas
    const promedioLlamadasDia = totalLlamadas > 0 ? Math.round(totalLlamadas / 30) : 0;
    
    // Porcentaje de contactabilidad (asumiendo que tener una acción comercial = contactado)
    const totalClientesEnPeriodo = await prisma.cliente.count({
      where: {
        fecha_creacion: {
          gte: new Date(fechaDesde),
          lte: new Date(fechaHasta + 'T23:59:59.999Z'),
        }
      }
    });
    
    const porcentajeContactabilidad = totalClientesEnPeriodo > 0 ? 
      Math.round((clientesContactados / totalClientesEnPeriodo) * 100) : 0;
    
    // Efectividad: acciones que resultaron en estados positivos
    const estadosPositivos = [
      'Promesa de Pago',
      'Seguimiento - Duda resuelta'
    ];
    
    const accionesPositivas = accionesPorEstado.reduce((acc, item) => {
      if (estadosPositivos.includes(item.estado || '')) {
        return acc + item._count.accion_comercial_id;
      }
      return acc;
    }, 0);
    
    const porcentajeEfectividad = totalLlamadas > 0 ? 
      Math.round((accionesPositivas / totalLlamadas) * 100) : 0;
    
    // Conversión: clientes que llegaron a estados de éxito total
    const estadosExitosos = ['Promesa de Pago'];
    const accionesExitosas = accionesPorEstado.reduce((acc, item) => {
      if (estadosExitosos.includes(item.estado || '')) {
        return acc + item._count.accion_comercial_id;
      }
      return acc;
    }, 0);
    
    const porcentajeConversion = totalLlamadas > 0 ? 
      Math.round((accionesExitosas / totalLlamadas) * 100) : 0;

    // 🔄 Formatear distribución de estados según los estados reales
    const distribucionEstados = {
      'Promesa de Pago': accionesPorEstado.find(item => item.estado === 'Promesa de Pago')?._count.accion_comercial_id || 0,
      'Seguimiento - Duda resuelta': accionesPorEstado.find(item => item.estado === 'Seguimiento - Duda resuelta')?._count.accion_comercial_id || 0,
      'No interesado': accionesPorEstado.find(item => item.estado === 'No interesado')?._count.accion_comercial_id || 0,
      'Seguimiento - Duda no resuelta': accionesPorEstado.find(item => item.estado === 'Seguimiento - Duda no resuelta')?._count.accion_comercial_id || 0,
    };

    console.log("🔍 Distribución de estados calculada:", distribucionEstados);

    // 🔄 Formatear tipos de acción
    const tiposAccion = accionesPorEstado.reduce((acc, item) => {
      acc[item.estado || 'Sin especificar'] = item._count.accion_comercial_id;
      return acc;
    }, {});

    // 🔄 Formatear actividad diaria
    const actividadDiariaFormateada = actividadDiaria.map(item => ({
      fecha: item.fecha_accion.toISOString().split('T')[0],
      cantidad: item._count.accion_comercial_id,
    }));

    // 🎯 Respuesta estructurada
    const estadisticas = {
      // Métricas principales (adaptadas para el dashboard)
      totalLlamadas, // Total de acciones comerciales
      llamadasHoy,
      llamadasMes: totalLlamadas, // En el rango seleccionado
      promedioLlamadasDia,
      tendencia: `${porcentajeContactabilidad >= 70 ? '+' : ''}${porcentajeContactabilidad}%`,
      
      // Métricas de rendimiento
      clientesContactados,
      porcentajeContactabilidad,
      porcentajeEfectividad,
      porcentajeConversion,
      
      // Distribución por estado de acciones comerciales
      distribucionEstados,
      
      // Tipos de acción comercial
      tiposAccion,
      
      // Actividad diaria
      actividadDiaria: actividadDiariaFormateada,
      
      // Para compatibilidad con el frontend existente - Gráfico por estados
      resultados: [
        { 
          name: 'Promesa de Pago', 
          value: distribucionEstados['Promesa de Pago'] || 0, 
          color: '#00C49F' 
        },
        { 
          name: 'Seguimiento - Duda resuelta', 
          value: distribucionEstados['Seguimiento - Duda resuelta'] || 0, 
          color: '#0088FE' 
        },
        { 
          name: 'No interesado', 
          value: distribucionEstados['No interesado'] || 0, 
          color: '#FF8042' 
        },
        { 
          name: 'Seguimiento - Duda no resuelta', 
          value: distribucionEstados['Seguimiento - Duda no resuelta'] || 0, 
          color: '#FFA726' 
        }
      ].filter(item => item.value > 0), // Solo mostrar estados con valores
      
      // Tendencia semanal para gráficos
      tendenciaSemanal: actividadDiariaFormateada.slice(-7).map((item, index) => ({
        dia: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][new Date(item.fecha).getDay()],
        llamadas: item.cantidad
      })),
      
      // Gestores (vacío por ahora, se puede implementar si se necesita)
      gestores: [],
      
      // Metadatos
      filtros: {
        gestor: gestor || 'todos',
        fechaDesde,
        fechaHasta,
        totalAcciones: totalLlamadas,
        totalClientesEnPeriodo,
      },
    };

    return NextResponse.json(estadisticas);

  } catch (error) {
    console.error("❌ Error al obtener estadísticas del asesor:", error);
    return NextResponse.json(
      { 
        error: "Error al obtener estadísticas", 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
