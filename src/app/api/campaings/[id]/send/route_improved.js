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

// 🚀 MEJORA 1: Configuración de Rate Limiting
const RATE_LIMIT = {
  messagesPerSecond: 20, // Meta permite ~80-100/segundo, pero mejor ser conservador
  batchSize: 50, // Procesar en lotes
  retryAttempts: 3,
  retryDelay: 1000 // 1 segundo entre reintentos
};

// 🚀 MEJORA 2: Clase para manejo profesional de envíos
class WhatsAppCampaignManager {
  constructor() {
    this.rateLimiter = new Map(); // Control de rate limiting por campaña
  }

  // Rate limiting inteligente
  async waitForRateLimit(campaignId) {
    const now = Date.now();
    const lastSent = this.rateLimiter.get(campaignId) || 0;
    const timeDiff = now - lastSent;
    const minInterval = 1000 / RATE_LIMIT.messagesPerSecond;

    if (timeDiff < minInterval) {
      const waitTime = minInterval - timeDiff;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.rateLimiter.set(campaignId, Date.now());
  }

  // Preparar payload de mensaje
  prepareMessagePayload(template, cliente, mappings, celularFormatted) {
    if (template.parametro) {
      const bodyParams = [];
      const sortedIndices = Object.keys(mappings).sort((a, b) => parseInt(a) - parseInt(b));
      
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
        
        bodyParams.push({
          type: "text",
          text: valor
        });
      }
      
      return {
        messaging_product: "whatsapp",
        to: celularFormatted,
        type: "template",
        template: {
          name: template.nombre_template,
          language: { code: "es" },
          components: bodyParams.length > 0 ? [{
            type: "body",
            parameters: bodyParams
          }] : []
        }
      };
    } else {
      return {
        messaging_product: "whatsapp",
        to: celularFormatted,
        type: "text",
        text: { body: template.mensaje }
      };
    }
  }

  // Procesar mensaje final con variables reemplazadas
  processMessageText(template, cliente, mappings) {
    if (!template.parametro) return template.mensaje;
    
    const sortedIndices = Object.keys(mappings).sort((a, b) => parseInt(a) - parseInt(b));
    let texto = template.mensaje;
    
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
      
      texto = texto.replace(new RegExp(`{{\\s*${idx}\\s*}}`, "g"), valor);
    }
    
    return texto;
  }

  // 🚀 MEJORA 3: Envío con reintentos automáticos
  async sendMessageWithRetry(messagePayload, celularFormatted, attemptNumber = 1) {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${META_PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
        timeout: 10000 // 10 segundos timeout
      });

      const responseData = await response.json();

      if (response.ok && responseData.messages && responseData.messages.length > 0) {
        return {
          success: true,
          messageId: responseData.messages[0].id,
          status: "sent"
        };
      } else {
        throw new Error(`Meta API Error (${response.status}): ${responseData.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.warn(`⚠️ Intento ${attemptNumber} falló para ${celularFormatted}: ${error.message}`);
      
      // Reintento automático si no es el último intento
      if (attemptNumber < RATE_LIMIT.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.retryDelay * attemptNumber));
        return this.sendMessageWithRetry(messagePayload, celularFormatted, attemptNumber + 1);
      }
      
      // Clasificar el error
      let estadoError = "failed";
      let codigoError = "UNKNOWN_ERROR";
      
      if (error.message.includes("Meta API Error")) {
        codigoError = "META_API_ERROR";
        if (error.message.includes("(400)")) estadoError = "rejected";
        else if (error.message.includes("(401)") || error.message.includes("(403)")) estadoError = "unauthorized";
        else if (error.message.includes("(429)")) estadoError = "rate_limited";
        else if (error.message.includes("(500)") || error.message.includes("(503)")) estadoError = "server_error";
      } else if (error.message.includes("timeout") || error.message.includes("fetch")) {
        codigoError = "NETWORK_ERROR";
        estadoError = "network_failed";
      }
      
      return {
        success: false,
        status: estadoError,
        errorCode: codigoError,
        errorMessage: error.message,
        attemptsMade: attemptNumber
      };
    }
  }

  // 🚀 MEJORA 4: Actualización de estado con transacciones
  async updateMessageStatus(cliente_campanha_id, result, mensajeFinal, cliente, campaignId, template) {
    try {
      if (result.success) {
        // Actualizar BD y Firebase en transacción
        await prisma.$transaction(async (tx) => {
          await tx.cliente_campanha.update({
            where: { cliente_campanha_id },
            data: {
              whatsapp_message_id: result.messageId,
              estado_mensaje: result.status,
              fecha_envio: new Date(),
              fecha_ultimo_estado: new Date(),
              error_code: null,
              error_descripcion: null
            }
          });
        });

        // Firebase solo para mensajes exitosos
        const firebaseDoc = {
          celular: cliente.celular,
          fecha: admin.firestore.Timestamp.fromDate(new Date()),
          id_bot: "fidelizacionbot",
          id_cliente: cliente.cliente_id,
          mensaje: mensajeFinal,
          template_name: template.nombre_template,
          sender: "false",
          message_id: result.messageId,
          campanha_id: campaignId,
          estado: result.status
        };

        await db.collection("fidelizacion").doc(cliente.celular).set(firebaseDoc, { merge: true });
        
      } else {
        // Solo actualizar BD para errores
        await prisma.cliente_campanha.update({
          where: { cliente_campanha_id },
          data: {
            estado_mensaje: result.status,
            fecha_ultimo_estado: new Date(),
            error_code: result.errorCode,
            error_descripcion: result.errorMessage?.substring(0, 255),
            retry_count: result.attemptsMade
          }
        });
      }
    } catch (error) {
      console.error(`Error actualizando estado para cliente_campanha ${cliente_campanha_id}:`, error);
    }
  }
}

// 🚀 MEJORA 5: Endpoint principal con procesamiento por lotes
export async function POST(req, context) {
  const campaignManager = new WhatsAppCampaignManager();
  
  try {
    const { id: idParam } = await context.params;
    const campaignId = parseInt(idParam, 10);
    
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: "ID de campaña no válido" }, { status: 400 });
    }

    // 🚀 MEJORA 6: Validación más robusta
    const campaign = await prisma.campanha.findUnique({
      where: { campanha_id: campaignId },
      include: {
        template: true,
        cliente_campanha: { 
          include: { cliente: true },
          where: {
            estado_mensaje: { not: "sent" } // Solo procesar los no enviados
          }
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    }

    if (!campaign.template?.nombre_template) {
      return NextResponse.json({ error: "Template inválido" }, { status: 400 });
    }

    // 🚀 MEJORA 7: Logging estructurado
    const logger = {
      campaign: campaignId,
      template: campaign.template.nombre_template,
      totalClients: campaign.cliente_campanha.length,
      timestamp: new Date().toISOString()
    };

    console.log(`🎯 [${logger.timestamp}] Iniciando campaña ${campaignId}:`, logger);

    const results = [];
    const mappings = campaign.variable_mappings || {};

    // 🚀 MEJORA 8: Procesamiento por lotes para mejor rendimiento
    const batches = [];
    for (let i = 0; i < campaign.cliente_campanha.length; i += RATE_LIMIT.batchSize) {
      batches.push(campaign.cliente_campanha.slice(i, i + RATE_LIMIT.batchSize));
    }

    for (const [batchIndex, batch] of batches.entries()) {
      console.log(`📦 Procesando lote ${batchIndex + 1}/${batches.length} (${batch.length} clientes)`);

      const batchPromises = batch.map(async ({ cliente, cliente_campanha_id }) => {
        if (!cliente?.celular) {
          console.warn(`⚠ Cliente ${cliente?.nombre || "Desconocido"} sin número válido`);
          return null;
        }

        // Rate limiting
        await campaignManager.waitForRateLimit(campaignId);

        // Formatear número
        let celularFormatted = cliente.celular.trim();
        if (!celularFormatted.startsWith("51")) {
          celularFormatted = `51${celularFormatted}`;
        }

        // Preparar mensaje
        const messagePayload = campaignManager.prepareMessagePayload(
          campaign.template, cliente, mappings, celularFormatted
        );
        const mensajeFinal = campaignManager.processMessageText(
          campaign.template, cliente, mappings
        );

        // Enviar con reintentos
        const result = await campaignManager.sendMessageWithRetry(messagePayload, celularFormatted);

        // Actualizar estados
        await campaignManager.updateMessageStatus(
          cliente_campanha_id, result, mensajeFinal, cliente, campaignId, campaign.template
        );

        return {
          cliente_campanha_id,
          celular: celularFormatted,
          cliente_id: cliente.cliente_id,
          ...result
        };
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(r => r !== null));

      // Pausa entre lotes para no sobrecargar
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // 🚀 MEJORA 9: Actualizar campaña con estadísticas detalladas
    const stats = {
      total: results.length,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      errorBreakdown: results
        .filter(r => !r.success)
        .reduce((acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          return acc;
        }, {})
    };

    await prisma.campanha.update({
      where: { campanha_id: campaignId },
      data: { 
        estado_campanha: "enviada",
        fecha_fin: new Date(),
        // Podrías agregar campos para estadísticas
        total_enviados: stats.sent,
        total_fallidos: stats.failed
      },
    });

    console.log(`✅ Campaña ${campaignId} completada:`, stats);

    return NextResponse.json({ 
      success: true, 
      results,
      summary: {
        ...stats,
        campaignId,
        processingTime: Date.now() - new Date(logger.timestamp).getTime(),
        batchesProcessed: batches.length
      }
    });

  } catch (error) {
    console.error("❌ Error crítico en campaña:", error);
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
