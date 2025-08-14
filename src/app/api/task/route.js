import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapeo de estados del frontend a estados exactos de la base de datos
const estadosMapping = {
  'Comunicacion inmediata': ['Comunicacion inmediata'],
  'Negociacion de pago': ['Negociacion de pago'],
  'Gestion de contrato': ['Gestion de contrato'],
  'duda': ['Duda agresiva no resuelta', 'Duda no resuelta','Seguimiento - Duda no resuelta',]
};

// GET - Obtener clientes filtrados por estado
export async function GET(request) {
  try {
    console.log('🚀 Iniciando GET /api/task');
    
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || '';

    console.log('📋 Parámetros recibidos:', { estado, page, limit, search });

    // Construir filtro base
    let whereClause = {};

    // Filtrar por estado si se especifica
    if (estado) {
      const estadosDB = estadosMapping[estado] || [estado];
      whereClause.estado = { in: estadosDB };
      console.log('🎯 Filtrando por estados:', estadosDB);
    }

    // Filtrar por búsqueda si se especifica
    if (search) {
      whereClause.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { celular: { contains: search, mode: 'insensitive' } },
        { documento_identidad: { contains: search, mode: 'insensitive' } }
      ];
      console.log('🔍 Aplicando búsqueda:', search);
    }

    console.log('🔧 Cláusula WHERE final:', JSON.stringify(whereClause, null, 2));

    // Obtener clientes
    const clientes = await prisma.cliente.findMany({
      where: whereClause,
      select: {
        cliente_id: true,
        nombre: true,
        apellido: true,
        celular: true,
        documento_identidad: true,
        estado: true,
        gestor: true,
        fecha_creacion: true,
        score: true
      },
      orderBy: { fecha_creacion: 'desc' },
      skip: page * limit,
      take: limit
    });

    console.log(`✅ Encontrados ${clientes.length} clientes`);

    // Contar total para paginación
    const totalClientes = await prisma.cliente.count({ where: whereClause });
    console.log(`📊 Total de clientes: ${totalClientes}`);

    // Formatear datos para el frontend
    const clientesFormateados = clientes.map(cliente => ({
      id: cliente.cliente_id,
      cliente: `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim(),
      telefono: cliente.celular,
      documento: cliente.documento_identidad,
      estado: cliente.estado,
      gestor: cliente.gestor || 'Sin asignar',
      fechaCreacion: cliente.fecha_creacion ? 
        new Date(cliente.fecha_creacion).toLocaleDateString('es-ES') : 
        'N/A',
      score: cliente.score,
      llamado: false // Por defecto, se puede implementar lógica más compleja después
    }));

    const response = {
      success: true,
      data: clientesFormateados,
      pagination: {
        page,
        limit,
        totalItems: totalClientes,
        totalPages: Math.ceil(totalClientes / limit),
        hasNextPage: (page + 1) * limit < totalClientes,
        hasPreviousPage: page > 0
      }
    };

    console.log('📤 Respuesta enviada:', {
      clientesCount: clientesFormateados.length,
      pagination: response.pagination
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error en GET /api/task:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}

// POST - Obtener estadísticas y métricas
export async function POST(request) {
  try {
    console.log('🚀 Iniciando POST /api/task para métricas');
    
    const body = await request.json();
    const { estados = [] } = body;
    
    console.log('📊 Calculando métricas para estados:', estados);

    // Obtener conteos por estado
    const metricas = {};
    
    // Si no se especifican estados, calcular para todos los estados configurados
    const estadosParaCalcular = estados.length > 0 ? estados : Object.keys(estadosMapping);
    
    for (const estadoFrontend of estadosParaCalcular) {
      const estadosDB = estadosMapping[estadoFrontend] || [estadoFrontend];
      
      // Contar total de clientes en este estado
      const totalClientes = await prisma.cliente.count({
        where: {
          estado: { in: estadosDB }
        }
      });

      // Para simplificar inicialmente, consideramos:
      // - Pendientes: todos los clientes en el estado
      // - Completados: 0 (se puede implementar lógica más compleja después)
      metricas[estadoFrontend] = {
        total: totalClientes,
        pendientes: totalClientes,
        completados: 0
      };

      console.log(`📈 ${estadoFrontend}: ${totalClientes} clientes`);
    }

    // Calcular estadísticas generales
    const totalGeneral = await prisma.cliente.count();
    const estadisticasGenerales = {
      total: totalGeneral,
      pendientes: totalGeneral, // Simplificado por ahora
      completadas: 0,
      efectividad: 0
    };

    const response = {
      success: true,
      metricas,
      estadisticasGenerales,
      timestamp: new Date().toISOString()
    };

    console.log('📤 Métricas calculadas:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error en POST /api/task:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error calculando métricas',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}

// Función auxiliar para logging limpio
function logQuery(description, query) {
  console.log(`🔍 ${description}:`);
  console.log(JSON.stringify(query, null, 2));
}
