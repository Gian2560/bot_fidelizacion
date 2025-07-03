import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import admin from "firebase-admin";
import twilio from "twilio";

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.warn("⚠️ Firebase initialization failed:", error.message);
  }
}

const db = admin.firestore();
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(req, { params }) {
  try {
    const campaignId = parseInt(params.id, 10);
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: "ID de campaña no válido" }, { status: 400 });
    }

    // Obtener la campaña con su template y clientes asociados
    const campaign = await prisma.campanha.findUnique({
      where: { campanha_id: campaignId },
      include: { template: true, cliente_campanha: { include: { cliente: true } } },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    }

    if (!campaign.template || !campaign.template.template_content_sid) {
      return NextResponse.json({ error: "La campaña no tiene un template válido" }, { status: 400 });
    }    const twilioWhatsAppNumber = `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;
    const sentMessages = [];

    // Procesar cada cliente de la campaña
    const promises = campaign.cliente_campanha.map(async ({ cliente, cliente_campanha_id }) => {
      if (!cliente || !cliente.celular) {
        console.warn(`⚠ Cliente ${cliente?.nombre || "Desconocido"} no tiene un número válido.`);
        return;
      }

      // Formatear el número de teléfono para Twilio
      let celularFormatted = cliente.celular.trim();
      if (!celularFormatted.startsWith("+51")) {
        celularFormatted = `+51${celularFormatted}`;
      }
      const twilioNumber = `whatsapp:${celularFormatted}`;
      
      const contentSid = campaign.template.template_content_sid;

      let messagePayload = {
        from: twilioWhatsAppNumber,
        to: twilioNumber,
        contentSid,
      };

      // Si la plantilla tiene parámetros dinámicos, los agregamos al payload
      if (campaign.template.parametro) {
        messagePayload.contentVariables = JSON.stringify({
          1: cliente.nombre,        // Primer parámetro, nombre del cliente
        });
      }      
      try {
        // 📌 Enviar el mensaje con Twilio
        const message = await client.messages.create(messagePayload);
        console.log(`📨 Mensaje enviado a ${celularFormatted}: ${message.sid}`);
        
        // No actualizar campos que no existen en el esquema - solo registrar en Firebase

        // 🔥 Agregar el mensaje a Firebase Firestore en la colección "fidelizacion"
        const firebaseDoc = {
          celular: celularFormatted,
          fecha: admin.firestore.Timestamp.fromDate(new Date()),
          id_bot: "fidelizacionbot",
          id_cliente: cliente.cliente_id,
          mensaje: campaign.template.mensaje || "Mensaje de campaña",
          sender: "false", // El bot envía el mensaje
          message_sid: message.sid,
          campanha_id: campaignId,
          estado: "enviado"
        };

        // Usar el celular como ID del documento para facilitar consultas
        await db.collection("fidelizacion").doc(celularFormatted).set(firebaseDoc, { merge: true });
        
        console.log(`✅ Mensaje registrado en Firestore para ${celularFormatted}`);

        sentMessages.push({ 
          to: celularFormatted, 
          status: "sent", 
          sid: message.sid,
          cliente_id: cliente.cliente_id
        });

      } catch (error) {
        console.error(`❌ Error al enviar mensaje a ${celularFormatted}:`, error);
        
        // Registrar el error en Firestore
        const errorDoc = {
          celular: celularFormatted,
          fecha: admin.firestore.Timestamp.fromDate(new Date()),
          id_bot: "fidelizacionbot",
          id_cliente: cliente.cliente_id,
          mensaje: campaign.template.mensaje || "Mensaje de campaña",
          sender: "false",
          campanha_id: campaignId,
          estado: "fallido",
          error: error.message
        };

        try {
          await db.collection("fidelizacion").doc(`${celularFormatted}_error_${Date.now()}`).set(errorDoc);
        } catch (firebaseError) {
          console.error("Error al registrar fallo en Firestore:", firebaseError);
        }

        sentMessages.push({ 
          to: celularFormatted, 
          status: "failed", 
          error: error.message,
          cliente_id: cliente.cliente_id
        });
      }
    });    // Esperar todas las promesas
    await Promise.all(promises);

    // Actualizar el estado de la campaña
    await prisma.campanha.update({
      where: { campanha_id: campaignId },
      data: { 
        estado_campanha: "enviada",
        fecha_fin: new Date()
      },
    });

    const successCount = sentMessages.filter(msg => msg.status === "sent").length;
    const failedCount = sentMessages.filter(msg => msg.status === "failed").length;

    return NextResponse.json({ 
      success: true, 
      sentMessages,
      summary: {
        total: sentMessages.length,
        sent: successCount,
        failed: failedCount,
        campaignId: campaignId
      }
    });
  } catch (error) {
    console.error("❌ Error en el envío de mensajes con Twilio:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
