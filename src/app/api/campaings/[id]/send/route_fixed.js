import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import admin from "firebase-admin";

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

// Configuración de Meta Business API
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const META_BUSINESS_ACCOUNT_ID = process.env.META_BUSINESS_ACCOUNT_ID;

export async function POST(req, context) {
  try {
    const { id: idParam } = await context.params;
    const campaignId = parseInt(idParam, 10);
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: "ID de campaña no válido" }, { status: 400 });
    }

    // Obtener la campaña con su template y clientes asociados
    const campaign = await prisma.campanha.findUnique({
      where: { campanha_id: campaignId },
      include: {
        template: true,
        cliente_campanha: { include: { cliente: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    }

    if (!campaign.template) {
      return NextResponse.json({ error: "La campaña no tiene un template válido" }, { status: 400 });
    }

    if (!campaign.template.nombre_template) {
      return NextResponse.json({ error: "El template no tiene un nombre_template válido para Meta Business" }, { status: 400 });
    }

    console.log(`🎯 Iniciando campaña ${campaignId} con template: ${campaign.template.nombre_template}`);
    console.log(`📋 Variable mappings:`, campaign.variable_mappings);

    const sentMessages = [];

    // Procesar cada cliente de la campaña
    const promises = campaign.cliente_campanha.map(async ({ cliente, cliente_campanha_id }) => {
      if (!cliente || !cliente.celular) {
        console.warn(`⚠ Cliente ${cliente?.nombre || "Desconocido"} no tiene un número válido.`);
        return;
      }

      // Formatear el número de teléfono para Meta Business API
      let celularFormatted = cliente.celular.trim();
      if (!celularFormatted.startsWith("51")) {
        celularFormatted = `51${celularFormatted}`;
      }
      
      // Preparar el mensaje para Meta Business API
      let messagePayload;
      
      if (campaign.template.parametro) {
        // Mensaje con plantilla y parámetros
        const mappings = campaign.variable_mappings || {};
        const templateComponents = [];
        
        // Crear parámetros para el cuerpo de la plantilla
        const bodyParams = [];
        
        // Ordenar los parámetros por índice numérico (1, 2, 3, 4, 5...)
        const sortedIndices = Object.keys(mappings).sort((a, b) => parseInt(a) - parseInt(b));
        
        for (const idx of sortedIndices) {
          const field = mappings[idx];
          let valor = cliente[field] ?? "";
          
          // Formatear valores específicos si es necesario
          if (field === 'monto' && valor) {
            // Asegurar que el monto tenga formato correcto
            valor = String(valor).replace(/,+$/, "");
          } else if (field === 'feccuota' && valor) {
            // Formatear fecha si es necesario
            valor = String(valor).trim();
          } else {
            valor = String(valor).trim().replace(/,+$/, "");
          }
          
          bodyParams.push({
            type: "text",
            text: valor
          });
        }
        
        if (bodyParams.length > 0) {
          templateComponents.push({
            type: "body",
            parameters: bodyParams
          });
        }
        
        messagePayload = {
          messaging_product: "whatsapp",
          to: celularFormatted,
          type: "template",
          template: {
            name: campaign.template.nombre_template,
            language: {
              code: "es"
            },
            components: templateComponents
          }
        };
        
        console.log(`📊 Parámetros enviados:`, bodyParams.map(p => p.text));
        console.log(`🗂️ Mapping utilizado:`, mappings);
        
      } else {
        // Mensaje de texto simple (sin parámetros)
        messagePayload = {
          messaging_product: "whatsapp",
          to: celularFormatted,
          type: "text",
          text: {
            body: campaign.template.mensaje
          }
        };
      }

      // Variable para almacenar el mensaje final procesado
      const mensajeFinal = campaign.template.parametro ? 
        (() => {
          const mappings = campaign.variable_mappings || {};
          const sortedIndices = Object.keys(mappings).sort((a, b) => parseInt(a) - parseInt(b));
          let texto = campaign.template.mensaje;
          
          for (const idx of sortedIndices) {
            const field = mappings[idx];
            let valor = cliente[field] ?? "";
            
            if (field === 'monto' && valor) {
              valor = String(valor).replace(/,+$/, "");
            } else if (field === 'feccuota' && valor) {
              valor = String(valor).trim();
            } else {
              valor = String(valor).trim().replace(/,+$/, "");
            }
            
            texto = texto.replace(
              new RegExp(`{{\\s*${idx}\\s*}}`, "g"),
              valor
            );
          }
          return texto;
        })() : campaign.template.mensaje;

      console.log(`📝 Mensaje final para ${cliente.celular}:`, mensajeFinal);

      try {
        // 📌 Enviar el mensaje con Meta Business API
        console.log("Meta Business API payload:", JSON.stringify(messagePayload, null, 2));
        
        const response = await fetch(`https://graph.facebook.com/v18.0/${META_PHONE_NUMBER_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messagePayload)
        });
        
        const responseData = await response.json();
        
        if (response.ok) {
          console.log(`📨 Mensaje enviado a ${celularFormatted}: ${responseData.messages[0].id}`);
          
          // El estado inicial de Meta siempre es "sent" cuando la API responde OK
          // Los estados "delivered" y "read" llegan después vía webhooks
          const estadoMeta = "sent"; // Estado inicial de Meta Business API
          
          // 📊 Actualizar tabla cliente_campanha con estado del mensaje
          await prisma.cliente_campanha.update({
            where: { cliente_campanha_id: cliente_campanha_id },
            data: {
              whatsapp_message_id: responseData.messages[0].id,
              estado_mensaje: estadoMeta, // Usar estado de Meta: "sent"
              fecha_envio: new Date(),
              fecha_ultimo_estado: new Date(),
              error_code: null,
              error_descripcion: null
            }
          });
          
          // 🔥 Agregar el mensaje a Firebase Firestore
          const firebaseDoc = {
            celular: celularFormatted,
            fecha: admin.firestore.Timestamp.fromDate(new Date()),
            id_bot: "fidelizacionbot",
            id_cliente: cliente.cliente_id,
            mensaje: mensajeFinal, // Mensaje completo con variables reemplazadas
            template_name: campaign.template.nombre_template, // Referencia al template
            sender: "false", // El bot envía el mensaje
            message_id: responseData.messages[0].id,
            campanha_id: campaignId,
            estado: estadoMeta // Usar el mismo estado de Meta
          };

          // Usar el celular como ID del documento para facilitar consultas
          await db.collection("fidelizacion").doc(celularFormatted).set(firebaseDoc, { merge: true });
          
          console.log(`✅ Mensaje registrado en Firestore para ${celularFormatted}`);
          console.log(`✅ Estado actualizado en cliente_campanha ID: ${cliente_campanha_id}`);

          sentMessages.push({ 
            to: celularFormatted, 
            status: estadoMeta, // Usar estado de Meta
            message_id: responseData.messages[0].id,
            cliente_id: cliente.cliente_id,
            cliente_campanha_id: cliente_campanha_id
          });
          
        } else {
          throw new Error(`Meta API Error: ${responseData.error?.message || 'Unknown error'}`);
        }

      } catch (error) {
        console.error(`❌ Error al enviar mensaje a ${celularFormatted}:`, error);
        
        // 📊 Actualizar tabla cliente_campanha con error
        try {
          await prisma.cliente_campanha.update({
            where: { cliente_campanha_id: cliente_campanha_id },
            data: {
              estado_mensaje: "failed", // Estado de error de Meta
              fecha_ultimo_estado: new Date(),
              error_code: "META_API_ERROR",
              error_descripcion: error.message?.substring(0, 255) || "Error desconocido"
            }
          });
          console.log(`❌ Error registrado en cliente_campanha ID: ${cliente_campanha_id}`);
        } catch (updateError) {
          console.error("Error actualizando cliente_campanha:", updateError);
        }
        
        // Registrar el error en Firestore
        const errorDoc = {
          celular: celularFormatted,
          fecha: admin.firestore.Timestamp.fromDate(new Date()),
          id_bot: "fidelizacionbot",
          id_cliente: cliente.cliente_id,
          mensaje: mensajeFinal, // Mensaje que se intentó enviar
          template_name: campaign.template.nombre_template,
          sender: "false",
          campanha_id: campaignId,
          estado: "failed",
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
          cliente_id: cliente.cliente_id,
          cliente_campanha_id: cliente_campanha_id
        });
      }
    });

    // Esperar todas las promesas
    await Promise.all(promises);
    
    // Asegura la conexión abierta
    await prisma.$connect();
    
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
    console.error("❌ Error en el envío de mensajes con Meta Business API:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
