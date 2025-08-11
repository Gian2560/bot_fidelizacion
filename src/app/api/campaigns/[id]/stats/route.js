import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request, context) {
  const params = await context.params;
  const { id } = params;
  try {
    const campaignId = parseInt(id);
    console.log('🔍 Obteniendo estadísticas para campaña ID:', campaignId);
    if (!campaignId || isNaN(campaignId)) {
      return NextResponse.json({ error: 'ID de campaña inválido' }, { status: 400 });
    }

    // Verificar que la campaña existe
    const campaign = await prisma.campanha.findUnique({
      where: { campanha_id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });
    }

    // Obtener todas las asociaciones cliente-campaña para esta campaña
    const clienteCampanhas = await prisma.cliente_campanha.findMany({
      where: { campanha_id: campaignId },
      include: {
        cliente: {
          select: {
            cliente_id: true,
            nombre: true,
            celular: true,
            estado: true,
          },
        },
      },
    });

    // Filtra solo los que tienen mensaje enviado
    const enviadosCampanhas = clienteCampanhas.filter(cc => cc.whatsapp_message_id && cc.whatsapp_message_id.trim() !== '');

    const totalEnviados = enviadosCampanhas.length;
    const entregados = enviadosCampanhas.filter(cc => 
      cc.estado_mensaje === 'delivered' || cc.estado_mensaje === 'sent'
    ).length;
    const fallidos = enviadosCampanhas.filter(cc => 
      cc.estado_mensaje === 'failed' || cc.estado_mensaje === 'undelivered'
    ).length;
    const respondidos = enviadosCampanhas.filter(cc => 
      cc.respuesta && cc.respuesta.trim() !== ''
    ).length;
    const leidos = entregados;
    const clientesContactados = new Set(enviadosCampanhas.map(cc => cc.cliente_id)).size;

    // Calcular tasas
    const tasaEntrega = totalEnviados > 0 ? entregados / totalEnviados : 0;
    const tasaLectura = entregados > 0 ? leidos / entregados : 0;
    const tasaRespuesta = leidos > 0 ? respondidos / leidos : 0;

    // Obtener datos para el gráfico por día (últimos 7 días)
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - 7);
    
    const actividadPorDia = await prisma.cliente_campanha.groupBy({
      by: ['fecha_ultimo_estado'],
      where: {
        campanha_id: campaignId,
        fecha_ultimo_estado: {
          gte: fechaInicio,
        },
      },
      _count: {
        estado_mensaje: true,
      },
    });

    // Obtener mensajes recientes (últimos 10)
    const mensajesRecientes = await prisma.cliente_campanha.findMany({
      where: { campanha_id: campaignId },
      include: {
        cliente: {
          select: {
            nombre: true,
            celular: true,
          },
        },
      },
      orderBy: { fecha_ultimo_estado: 'desc' },
      take: 10,
    });

    const estadoMapping = {
      sent: 'Enviado',
      delivered: 'Entregado',
      read: 'Leído',
      failed: 'Fallido',
      undelivered: 'No entregado',
      deleted: 'Eliminado',
      responded: 'Respondido',
    };

    const mensajesFormateados = mensajesRecientes.map((msg, index) => ({
      id: index + 1,
      destinatario: msg.cliente.celular,
      estado: estadoMapping[msg.estado_mensaje] || 'Desconocido',
      fecha: msg.fecha_ultimo_estado ? new Date(msg.fecha_ultimo_estado).toLocaleString('es-PE') : '',
      respuesta: msg.respuesta && msg.respuesta.trim() !== '' ? msg.respuesta : '',
    }));

    // Datos por día de la semana (simulado para demo)
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const hoy = new Date();
    const barData = [];
    
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      const diaSemana = diasSemana[fecha.getDay()];
      
      // Simulamos datos basados en la fecha para demo
      const factor = 0.1 + (Math.sin(i) + 1) * 0.3;
      barData.push({
        dia: diaSemana,
        enviados: Math.round(totalEnviados * factor / 7),
        entregados: Math.round(entregados * factor / 7),
        leidos: Math.round(leidos * factor / 7),
        respondidos: Math.round(respondidos * factor / 7),
      });
    }

    const response = {
      totalEnviados,
      entregados,
      leidos,
      fallidos,
      respondidos,
      clientesContactados,
      tasaEntrega,
      tasaLectura,
      tasaRespuesta,
      barData,
      mensajesRecientes: mensajesFormateados,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error al obtener estadísticas de campaña:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
