import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req, { params }) {
    try {
      const id = parseInt(params.id); // ✅ Convertimos el ID a número
      if (isNaN(id)) {
        return NextResponse.json({ error: "ID de campaña no válido" }, { status: 400 });
      }
  
      const body = await req.json();
      const { nombre_campanha, descripcion, fecha_fin, estado_campanha, template_id } = body;
  
      // 🔹 Validar si la campaña existe antes de actualizar
      const existingCampaign = await prisma.campanha.findUnique({ where: { campanha_id: id } });
      if (!existingCampaign) {
        return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
      }
  
      // 🔹 Actualizar campaña en la base de datos
      const updatedCampaign = await prisma.campanha.update({
        where: { campanha_id: id },
        data: {
          nombre_campanha,
          descripcion,
          fecha_fin: fecha_fin ? new Date(fecha_fin) : null,
          estado_campanha,
          template_id: template_id ? parseInt(template_id) : null,
        },
      });
  
      return NextResponse.json(updatedCampaign);
    } catch (error) {
      console.error("❌ Error al actualizar campaña:", error);
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// 📌 Eliminar campaña con validaciones
export async function DELETE(req, { params }) {
    try {
        const { id } = params;
        const campaignId = parseInt(id);

        if (isNaN(campaignId)) {
            return NextResponse.json({ error: "ID de campaña no válido" }, { status: 400 });
        }

        // 🔹 Verificar si la campaña existe
        const campanha = await prisma.campanha.findUnique({
            where: { campanha_id: campaignId },
            include: {
                cliente_campanha: {
                    select: {
                        estado_mensaje: true,
                        fecha_envio: true
                    }
                }
            }
        });

        if (!campanha) {
            return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
        }

        // 🔹 Verificar si la campaña ha sido enviada
        const mensajesEnviados = campanha.cliente_campanha.some(
            clienteCampanha => clienteCampanha.fecha_envio !== null || 
            clienteCampanha.estado_mensaje === 'enviado' ||
            clienteCampanha.estado_mensaje === 'delivered' ||
            clienteCampanha.estado_mensaje === 'read'
        );

        if (mensajesEnviados) {
            return NextResponse.json({ 
                error: "No se puede eliminar una campaña que ya ha sido enviada" 
            }, { status: 400 });
        }

        // 🔹 Eliminar registros relacionados primero (cliente_campanha)
        await prisma.cliente_campanha.deleteMany({ 
            where: { campanha_id: campaignId } 
        });

        // 🔹 Eliminar la campaña
        await prisma.campanha.delete({ 
            where: { campanha_id: campaignId } 
        });

        return NextResponse.json({ 
            message: "Campaña eliminada exitosamente" 
        });

    } catch (error) {
        console.error("Error al eliminar campaña:", error);
        return NextResponse.json({ 
            error: "Error interno del servidor al eliminar la campaña" 
        }, { status: 500 });
    }
}

// 📌 Obtener detalles de una campaña específica
export async function GET(req, { params }) {
    try {
        const { id } = params;
        const campaignId = parseInt(id);

        if (isNaN(campaignId)) {
            return NextResponse.json({ error: "ID de campaña no válido" }, { status: 400 });
        }
        
        const campanha = await prisma.campanha.findUnique({
            where: { campanha_id: campaignId },
            include: {
                template: true,
                cliente_campanha: {
                    include: {
                        cliente: {
                            select: {
                                nombre: true,
                                celular: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        if (!campanha) {
            return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
        }

        return NextResponse.json({ campanha });
    } catch (error) {
        console.error("Error al obtener campaña:", error);
        return NextResponse.json({ error: "Error al obtener la campaña" }, { status: 500 });
    }
}