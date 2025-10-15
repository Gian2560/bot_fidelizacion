import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {createMetaTemplate, getAllMetaTemplates} from '../../../../services/metaTemplateService';
export async function GET(request) {
  try {
    const metaResult = await getAllMetaTemplates();
    if (!metaResult.success) {
      return NextResponse.json({ error: metaResult.error }, { status: 500 });
    }
    return NextResponse.json(metaResult.plantillas);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { nombre, mensaje, categoria, idioma, header, footer, botones, guardar_en_bd, ejemplos_mensaje, ejemplos_header } = await request.json();
    
    const metaResult = await createMetaTemplate({
      nombre, mensaje, categoria: categoria || 'MARKETING', idioma: idioma || 'es_PE',
      header, footer, botones, ejemplos_mensaje, ejemplos_header
    });

    if (!metaResult.success) {
      return NextResponse.json({ success: false, error: metaResult.error }, { status: 500 });
    }

    let bdResult = null;
    if (guardar_en_bd) {
      try {
        const plantillaDB = await prisma.plantilla.create({
          data: {
            nombre, mensaje_cliente: mensaje, nombre_meta: metaResult.nombre_meta,
            meta_id: metaResult.meta_id, estado_meta: metaResult.estado,
            categoria: categoria || 'MARKETING', idioma: idioma || 'es_PE',
            header: header || null, footer: footer || null,
            created_at: new Date(), updated_at: new Date()
          }
        });
        bdResult = { success: true, id: plantillaDB.id };
      } catch (dbError) {
        bdResult = { success: false, error: dbError.message };
      }
    }

    return NextResponse.json({
      success: true,
      plantilla: {
        id: metaResult.meta_id, nombre, nombre_meta: metaResult.nombre_meta,
        estado_meta: metaResult.estado, mensaje_cliente: mensaje,
        categoria: categoria || 'MARKETING', idioma: idioma || 'es_PE'
      },
      bd: bdResult
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
