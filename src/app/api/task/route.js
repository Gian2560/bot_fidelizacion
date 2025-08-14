import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';

    // Validar que se proporcione un estado
    if (!estado) {
      return NextResponse.json(
        { error: 'El parámetro estado es requerido' },
        { status: 400 }
      );
    }

    console.log('Estado recibido:', estado);

    // Primero, vamos a ver qué estados únicos existen en la base de datos
    const estadosUnicos = await prisma.cliente.findMany({
      select: { estado: true },
      distinct: ['estado'],
      where: {
        estado: {
          not: null
        }
      }
    });
    
    console.log('Estados únicos en BD:', estadosUnicos.map(e => e.estado));

    // Mapeo de estados exactos de BD con agrupación
    const estadoMapping = {
      'comunicacion_inmediata': ['Comunicacion inmediata'],
      'negociacion_pago': ['Negociacion de pago'], 
      'gestion_contrato': ['Gestion de contrato'],
      'reclamos': ['reclamos', 'Reclamos', 'reclamo'],
      'duda': ['Duda agresiva no resuelta', 'Duda no resuelta'], // Agrupa ambos tipos de dudas
      'enojado': ['Enojado'],
      'no_interesado': ['No interesado'],
      'promesa_pago': ['Promesa de pago'],
      'duda_resuelta': ['Duda resuelta']
    };

    // Buscar el estado correcto - puede devolver múltiples estados para "duda"
    let estadosDB = [];
    for (const [key, values] of Object.entries(estadoMapping)) {
      if (key === estado) {
        // Para "duda", buscar ambos tipos
        for (const value of values) {
          const existe = estadosUnicos.find(e => e.estado === value);
          if (existe) {
            estadosDB.push(value);
          }
        }
        break;
      }
    }

    if (estadosDB.length === 0) {
      return NextResponse.json(
        { 
          error: 'Estado no válido o no encontrado en BD', 
          estadoRecibido: estado,
          estadosDisponibles: estadosUnicos.map(e => e.estado)
        },
        { status: 400 }
      );
    }

    console.log('Estados mapeados a BD:', estadosDB);
    
    const offset = (page - 1) * limit;

    // Obtener fecha de inicio y fin del mes actual
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
    
    console.log('Filtrando por fechas:', {
      inicioMes: inicioMes.toISOString(),
      finMes: finMes.toISOString(),
      mesActual: ahora.getMonth() + 1,
      añoActual: ahora.getFullYear()
    });

    // Query optimizada usando historico_estado para obtener la fecha exacta del estado
    // Usamos la base query y agregamos filtros de búsqueda si es necesario
    const baseWhereClause = {
      estado: {
        in: estadosDB // Usar 'in' para múltiples estados (ej: ambos tipos de "duda")
      },
      // El cliente debe tener un contrato
      contrato: {
        isNot: null,
        // Y en el historial de estados debe tener uno de los estados en este mes
        historico_estado: {
          some: {
            estado: {
              in: estadosDB
            },
            fecha_estado: {
              gte: inicioMes,
              lte: finMes
            }
          }
        }
      },
      OR: [
        // Casos donde no tiene acciones comerciales
        {
          accion_comercial: {
            none: {}
          }
        },
        // Casos donde tiene acciones comerciales (los filtraremos después por fechas)
        {
          accion_comercial: {
            some: {}
          }
        }
      ]
    };

    // Agregar filtros de búsqueda si se proporcionan
    const whereClause = search ? {
      AND: [
        baseWhereClause,
        {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' } },
            { apellido: { contains: search, mode: 'insensitive' } },
            { celular: { contains: search } },
            { documento_identidad: { contains: search } }
          ]
        }
      ]
    } : baseWhereClause;

    console.log('Where clause final:', JSON.stringify(whereClause, null, 2));

    // Obtener clientes usando la whereClause optimizada
    const clientesRaw = await prisma.cliente.findMany({
      where: whereClause,
      include: {
        accion_comercial: {
          orderBy: {
            fecha_accion: 'desc'
          },
          take: 1
        },
        contrato: {
          include: {
            historico_estado: {
              where: {
                estado: {
                  in: estadosDB // Buscar cualquiera de los estados mapeados
                }
              },
              orderBy: {
                fecha_estado: 'desc'
              },
              take: 1
            }
          }
        }
      }
    });

    // Filtrar clientes donde la fecha del estado sea más reciente que la última acción comercial
    const clientesFiltrados = clientesRaw.filter(cliente => {
      // Si no tiene acciones comerciales, incluirlo
      if (!cliente.accion_comercial || cliente.accion_comercial.length === 0) {
        return true;
      }

      // Obtener la fecha de la última acción comercial
      const ultimaAccionFecha = new Date(cliente.accion_comercial[0].fecha_accion);
      
      // Obtener la fecha exacta del estado desde historico_estado
      const fechaEstado = cliente.contrato?.historico_estado?.[0]?.fecha_estado;
      
      if (!fechaEstado) {
        // Si no hay fecha de estado en el histórico, usar fecha_ultima_interaccion como fallback
        const fechaFallback = cliente.fecha_ultima_interaccion ? 
          new Date(cliente.fecha_ultima_interaccion) : 
          new Date(cliente.fecha_creacion);
        return fechaFallback > ultimaAccionFecha;
      }

      return new Date(fechaEstado) > ultimaAccionFecha;
    });

    // Aplicar paginación
    const totalClientes = clientesFiltrados.length;
    const clientesPaginados = clientesFiltrados.slice(offset, offset + limit);

    // Obtener datos adicionales para cada cliente paginado
    const clientesConDatos = await Promise.all(
      clientesPaginados.map(async (cliente) => {
        // Verificar si ya se llamó al cliente (tiene acción comercial reciente)
        const ultimaAccion = await prisma.accion_comercial.findFirst({
          where: { cliente_id: cliente.cliente_id },
          orderBy: { fecha_accion: 'desc' }
        });

        // Calcular si fue llamado (tiene acción comercial posterior al estado)
        const fechaEstadoHistorico = cliente.contrato?.historico_estado?.[0]?.fecha_estado;
        const fechaEstadoFinal = fechaEstadoHistorico || cliente.fecha_ultima_interaccion;
        
        const fueComercial = ultimaAccion && fechaEstadoFinal ? 
          new Date(ultimaAccion.fecha_accion) > new Date(fechaEstadoFinal) : 
          false;

        return {
          id: cliente.cliente_id,
          cliente: `${cliente.nombre} ${cliente.apellido || ''}`.trim(),
          telefono: cliente.celular,
          email: cliente.email || 'No registrado',
          documento: cliente.documento_identidad || 'No registrado',
          estado: estado, // Devolver el estado del front
          fechaCreacion: cliente.fecha_creacion?.toISOString().split('T')[0] || '',
          fechaLlamada: ultimaAccion?.fecha_accion?.toISOString().split('T')[0] || null,
          llamado: fueComercial,
          gestor: cliente.gestor || 'No asignado',
          observacion: cliente.observacion || ultimaAccion?.nota || 'Sin observaciones',
          monto: cliente.monto || '0',
          score: cliente.score || 'no_score',
          estadoAsesor: cliente.estado_asesor || 'Sin estado'
        };
      })
    );

    // Calcular estadísticas
    const totalPendientes = clientesConDatos.filter(c => !c.llamado).length;
    const totalCompletados = clientesConDatos.filter(c => c.llamado).length;
    const totalPages = Math.ceil(totalClientes / limit);

    return NextResponse.json({
      success: true,
      data: clientesConDatos,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalClientes,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      stats: {
        total: totalClientes,
        pendientes: totalClientes - clientesConDatos.filter(c => c.llamado).length, // Total pendientes del estado
        completadas: clientesConDatos.filter(c => c.llamado).length,
        currentPagePendientes: totalPendientes,
        currentPageCompletados: totalCompletados
      }
    });

  } catch (error) {
    console.error('Error en /api/task:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

// Endpoint para obtener estadísticas generales de todos los estados
export async function POST(request) {
  try {
    // Obtener fecha de inicio y fin del mes actual
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
    
    console.log('POST - Filtrando por fechas:', {
      inicioMes: inicioMes.toISOString(),
      finMes: finMes.toISOString(),
      mesActual: ahora.getMonth() + 1,
      añoActual: ahora.getFullYear()
    });

    // Obtener estados únicos de la base de datos del mes actual usando historico_estado
    const estadosUnicos = await prisma.cliente.findMany({
      select: { estado: true },
      distinct: ['estado'],
      where: {
        estado: {
          not: null
        },
        contrato: {
          historico_estado: {
            some: {
              fecha_estado: {
                gte: inicioMes,
                lte: finMes
              }
            }
          }
        }
      }
    });

    console.log('Estados únicos en BD para estadísticas (mes actual):', estadosUnicos.map(e => e.estado));

    // Mapeo de estados exactos de BD con agrupación (igual que en GET)
    const estadoMapping = {
      'comunicacion_inmediata': ['Comunicacion inmediata'],
      'negociacion_pago': ['Negociacion de pago'], 
      'gestion_contrato': ['Gestion de contrato'],
      'reclamos': ['reclamos', 'Reclamos', 'reclamo'],
      'duda': ['Duda agresiva no resuelta', 'Duda no resuelta'], // Agrupa ambos tipos de dudas
      'enojado': ['Enojado'],
      'no_interesado': ['No interesado'],
      'promesa_pago': ['Promesa de pago'],
      'duda_resuelta': ['Duda resuelta']
    };

    const estadisticas = await Promise.all(
      Object.keys(estadoMapping).map(async (estadoKey) => {
        // Buscar todos los estados que corresponden a esta clave (ej: "duda" = ambos tipos)
        let estadosDB = [];
        for (const value of estadoMapping[estadoKey]) {
          const existe = estadosUnicos.find(e => e.estado === value);
          if (existe) {
            estadosDB.push(value);
          }
        }

        if (estadosDB.length === 0) {
          return {
            estado: estadoKey,
            total: 0,
            pendientes: 0,
            completados: 0
          };
        }

        // Obtener todos los clientes de estos estados del mes actual
        const clientesEstado = await prisma.cliente.findMany({
          where: { 
            estado: {
              in: estadosDB // Usar múltiples estados para "duda"
            },
            contrato: {
              historico_estado: {
                some: {
                  estado: {
                    in: estadosDB
                  },
                  fecha_estado: {
                    gte: inicioMes,
                    lte: finMes
                  }
                }
              }
            }
          },
          include: {
            accion_comercial: {
              orderBy: { fecha_accion: 'desc' },
              take: 1
            },
            contrato: {
              include: {
                historico_estado: {
                  where: {
                    estado: {
                      in: estadosDB
                    }
                  },
                  orderBy: {
                    fecha_estado: 'desc'
                  },
                  take: 1
                }
              }
            }
          }
        });

        // Filtrar según la lógica de negocio usando fecha de historico_estado
        const clientesFiltrados = clientesEstado.filter(cliente => {
          if (!cliente.accion_comercial || cliente.accion_comercial.length === 0) {
            return true;
          }

          const ultimaAccionFecha = new Date(cliente.accion_comercial[0].fecha_accion);
          
          // Usar fecha del historico_estado como primera opción
          const fechaEstadoHistorico = cliente.contrato?.historico_estado?.[0]?.fecha_estado;
          const fechaEstado = fechaEstadoHistorico ? 
            new Date(fechaEstadoHistorico) : 
            (cliente.fecha_ultima_interaccion ? 
              new Date(cliente.fecha_ultima_interaccion) : 
              new Date(cliente.fecha_creacion));

          return fechaEstado > ultimaAccionFecha;
        });

        // Calcular completados (clientes con acción comercial posterior al estado)
        const completados = clientesFiltrados.filter(cliente => {
          const ultimaAccion = cliente.accion_comercial[0];
          if (!ultimaAccion) return false;
          
          const fechaEstadoHistorico = cliente.contrato?.historico_estado?.[0]?.fecha_estado;
          const fechaEstadoFinal = fechaEstadoHistorico || cliente.fecha_ultima_interaccion;
          
          if (!fechaEstadoFinal) return false;
          
          return new Date(ultimaAccion.fecha_accion) > new Date(fechaEstadoFinal);
        }).length;

        console.log(`Estadísticas para ${estadoKey}:`, { total: clientesFiltrados.length, pendientes: clientesFiltrados.length - completados, completados });

        return {
          estado: estadoKey,
          total: clientesFiltrados.length,
          pendientes: clientesFiltrados.length - completados,
          completados
        };
      })
    );

    return NextResponse.json({
      success: true,
      estadisticas
    });

  } catch (error) {
    console.error('Error en POST /api/task:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
