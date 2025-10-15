import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET - Obtener plantillas aprobadas
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Filtros para plantillas aprobadas (puede estar en inglés o español)
    const whereClause = {
      estado_meta: {
        in: ['APPROVED', 'approved', 'APROBADO', 'aprobado']
      },
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { nombre_meta: { contains: search, mode: 'insensitive' } },
          { categoria: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    // Obtener todas las plantillas aprobadas sin paginación
    const plantillas = await prisma.plantilla.findMany({
      where: whereClause,
      orderBy: { created_at: 'asc' },
      select: {
        id: true,
        nombre: true,
        mensaje_cliente: true,
        nombre_meta: true,
        categoria: true,
        idioma: true
      }
    });

    // Formato simple para compatibilidad con la página de campañas
    return NextResponse.json(plantillas);

  } catch (error) {
    console.error('Error al obtener plantillas:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor al obtener plantillas',
        details: error.message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Crear nueva plantilla
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      nombre,
      mensaje_cliente,
      nombre_meta,
      meta_id,
      categoria = 'MARKETING',
      idioma = 'es',
      header,
      footer
    } = body;

    // Validaciones básicas
    if (!nombre || !mensaje_cliente) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nombre y mensaje_cliente son requeridos'
        },
        { status: 400 }
      );
    }

    const nuevaPlantilla = await prisma.plantilla.create({
      data: {
        nombre,
        mensaje_cliente,
        nombre_meta,
        meta_id,
        categoria,
        idioma,
        header,
        footer,
        estado_meta: 'PENDING', // Por defecto pending hasta aprobación
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: nuevaPlantilla,
      message: 'Plantilla creada exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear plantilla:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor al crear plantilla',
        details: error.message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Actualizar plantilla
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de plantilla es requerido'
        },
        { status: 400 }
      );
    }

    const plantillaActualizada = await prisma.plantilla.update({
      where: { id: parseInt(id) },
      data: {
        ...updateData,
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: plantillaActualizada,
      message: 'Plantilla actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar plantilla:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: 'Plantilla no encontrada'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor al actualizar plantilla',
        details: error.message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Eliminar plantilla
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de plantilla es requerido'
        },
        { status: 400 }
      );
    }

    await prisma.plantilla.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({
      success: true,
      message: 'Plantilla eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar plantilla:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: 'Plantilla no encontrada'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor al eliminar plantilla',
        details: error.message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}