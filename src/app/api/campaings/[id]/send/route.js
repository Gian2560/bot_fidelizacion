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

// 🔍 Función de logging estructurado
const logStructured = (level, step, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    level,
    step,
    message,
    ...data
  };
  
  const icon = {
    'info': 'ℹ️',
    'success': '✅',
    'warning': '⚠️',
    'error': '❌',
    'debug': '🔍'
  }[level] || '📋';
  
  console.log(`${icon} [${step}] ${message}`, Object.keys(data).length > 0 ? data : '');
};

// 🚀 MEJORA 1: Configuración de Rate Limiting OPTIMIZADA
const RATE_LIMIT = {
  messagesPerSecond: 50, // Optimizado para máximo rendimiento seguro
  batchSize: 100, // Lotes más grandes para mejor eficiencia
  retryAttempts: 2, // Menos reintentos para ser más rápido
  retryDelay: 500, // Delay más corto entre reintentos
  concurrentBatches: 3, // Procesar múltiples lotes en paralelo
  pauseBetweenBatches: 100 // Pausa mínima entre lotes (ms)
};

// 🚀 MEJORA 2: Clase para manejo profesional de envíos
class WhatsAppCampaignManager {
  constructor() {
    this.rateLimiter = new Map(); // Control de rate limiting por campaña
  }

  // Rate limiting optimizado para máxima velocidad
  async waitForRateLimit(campaignId) {
    const now = Date.now();
    const lastSent = this.rateLimiter.get(campaignId) || 0;
    const timeDiff = now - lastSent;
    const minInterval = 1000 / RATE_LIMIT.messagesPerSecond; // Intervalo más corto

    if (timeDiff < minInterval) {
      const waitTime = minInterval - timeDiff;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.rateLimiter.set(campaignId, Date.now());
  }

  // Preparar payload de mensaje - SIEMPRE usar plantilla de Meta Business
  prepareMessagePayload(template, cliente, mappings, celularFormatted) {
    // SIEMPRE enviar como template, nunca como texto libre
    const bodyParams = [];
    const sortedIndices = Object.keys(mappings).sort((a, b) => parseInt(a) - parseInt(b));
    
    console.log(`🎯 [TEMPLATE_MODE] Usando plantilla de Meta Business: ${template.nombre_template}`);
    console.log(`🗂️ [MAPPINGS] Procesando variables:`, mappings);
    
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
      
      console.log(`📝 [PARAM_${idx}] ${field}: "${valor}"`);
      
      bodyParams.push({
        type: "text",
        text: valor
      });
    }
    
    const payload = {
      messaging_product: "whatsapp",
      to: celularFormatted,
      type: "template", // SIEMPRE template
      template: {
        name: template.nombre_template, // Plantilla registrada en Meta Business
        language: { code: "es_PE"},
        components: bodyParams.length > 0 ? [{
          type: "body",
          parameters: bodyParams
        }] : []
      }
    };
    
    console.log(`📦 [TEMPLATE_PAYLOAD] Payload final:`, JSON.stringify(payload, null, 2));
    return payload;
  }

  // Procesar mensaje final con variables reemplazadas - SOLO PARA REFERENCIA/FIREBASE
  processMessageText(template, cliente, mappings) {
    // Solo para guardar en Firebase como referencia del mensaje procesado
    const sortedIndices = Object.keys(mappings).sort((a, b) => parseInt(a) - parseInt(b));
    let texto = template.mensaje || `Template: ${template.nombre_template}`;
    
    console.log(`📄 [MESSAGE_PROCESSING] Procesando mensaje para referencia: "${texto.substring(0, 50)}..."`);
    
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
      
      // Reemplazar variables {{1}}, {{2}}, etc. con los valores reales
      texto = texto.replace(new RegExp(`{{\\s*${idx}\\s*}}`, "g"), valor);
    }
    
    console.log(`📝 [MESSAGE_FINAL] Mensaje procesado para referencia: "${texto.substring(0, 100)}..."`);
    return texto;
  }

  // 🚀 MEJORA 3: Envío optimizado con reintentos rápidos
  async sendMessageWithRetry(messagePayload, celularFormatted, attemptNumber = 1) {
    console.log(`📤 [SEND] Intento ${attemptNumber} para ${celularFormatted}`);
    console.log(`📋 [PAYLOAD] Payload:`, JSON.stringify(messagePayload, null, 2));
    
    try {
      console.log(`🌐 [API] Enviando request a Meta Business API`);
      const response = await fetch(`https://graph.facebook.com/v23.0/${META_PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
        timeout: 8000 // Timeout más corto para ser más rápido
      });

      console.log(`📈 [RESPONSE] Status: ${response.status}, OK: ${response.ok}`);
      const responseData = await response.json();
      console.log(`📄 [RESPONSE_DATA]`, responseData);
      
      // 🔍 VERIFICAR MESSAGE ID Y STATUS ADICIONAL
      if (responseData.messages && responseData.messages.length > 0) {
        const message = responseData.messages[0];
        console.log(`🆔 [MESSAGE_ID] ID del mensaje: ${message.id}`);
        console.log(`📱 [WHATSAPP_ID] WhatsApp ID del destinatario: ${responseData.contacts?.[0]?.wa_id}`);
        console.log(`📞 [INPUT_NUMBER] Número de entrada: ${responseData.contacts?.[0]?.input}`);
        
        // Verificar si hay información adicional del estado
        if (message.message_status) {
          console.log(`📊 [MESSAGE_STATUS] Estado del mensaje: ${message.message_status}`);
        }
      }

      if (response.ok && responseData.messages && responseData.messages.length > 0) {
        console.log(`✅ [SUCCESS] Mensaje enviado a ${celularFormatted}: ${responseData.messages[0].id}`);
        return {
          success: true,
          messageId: responseData.messages[0].id,
          status: "sent"
        };
      } else {
        const errorMsg = `Meta API Error (${response.status}): ${responseData.error?.message || 'Unknown error'}`;
        console.error(`❌ [API_ERROR] ${errorMsg}`);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error(`💥 [CATCH_ERROR] Intento ${attemptNumber} falló:`, error.message);
      
      // Reintento más rápido si no es el último intento
      if (attemptNumber < RATE_LIMIT.retryAttempts) {
        console.log(`🔄 [RETRY] Esperando ${RATE_LIMIT.retryDelay}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.retryDelay));
        return this.sendMessageWithRetry(messagePayload, celularFormatted, attemptNumber + 1);
      }
      
      // Clasificar el error rápidamente
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
      
      console.error(`🏷️ [ERROR_CLASSIFIED] Estado: ${estadoError}, Código: ${codigoError}`);
      
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
    console.log(`💾 [UPDATE_START] Actualizando estado para cliente_campanha_id: ${cliente_campanha_id}`);
    console.log(`📊 [UPDATE_DATA] Result:`, result);
    
    try {
      if (result.success) {
        console.log(`✅ [UPDATE_SUCCESS] Procesando mensaje exitoso`);
        
        // Actualizar BD y Firebase en transacción
        await prisma.$transaction(async (tx) => {
          console.log(`🔄 [TRANSACTION] Iniciando transacción de BD`);
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
          console.log(`✅ [TRANSACTION] BD actualizada correctamente`);
        });

        // Firebase solo para mensajes exitosos
        console.log(`🔥 [FIREBASE] Guardando mensaje en Firestore`);
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
        console.log(`✅ [FIREBASE] Mensaje guardado en Firestore`);
        
      } else {
        console.log(`❌ [UPDATE_ERROR] Procesando mensaje fallido`);
        
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
        console.log(`❌ [BD_ERROR] Error registrado en BD`);
      }
    } catch (error) {
      console.error(`💥 [UPDATE_CRITICAL] Error actualizando estado para cliente_campanha ${cliente_campanha_id}:`, {
        error: error.message,
        cliente_campanha_id,
        result
      });
    }
  }
}

// 🚀 MEJORA 5: Endpoint principal con procesamiento por lotes
export async function POST(req, context) {
  console.log("🔥 [START] Iniciando endpoint de envío de campaña");
  
  const campaignManager = new WhatsAppCampaignManager();
  let campaignId = null; // Inicializar campaignId fuera del try
  
  try {
    console.log("📝 [STEP 1] Extrayendo parámetros de la request");
    const { id: idParam } = await context.params;
    campaignId = parseInt(idParam, 10); // Asignar valor
    console.log(`📋 [PARAMS] ID recibido: ${idParam}, ID parseado: ${campaignId}`);
    
    if (isNaN(campaignId)) {
      console.error("❌ [ERROR] ID de campaña no válido:", idParam);
      return NextResponse.json({ error: "ID de campaña no válido" }, { status: 400 });
    }

    console.log("🔍 [STEP 2] Buscando campaña en base de datos");
    // 🚀 MEJORA 6: Validación más robusta
    const campaign = await prisma.campanha.findUnique({
      where: { campanha_id: campaignId },
      include: {
        template: true,
        cliente_campanha: { 
          include: { cliente: true },
          where: {
            OR: [
                { estado_mensaje: { not: "sent" } },  // No enviados
                { estado_mensaje: null }              // Sin estado (nuevos)
              ]
          }
        },
      },
    });

    console.log(`📊 [QUERY] Campaña encontrada: ${campaign ? 'SÍ' : 'NO'}`);
    if (campaign) {
      console.log(`📋 [CAMPAIGN] ID: ${campaign.campanha_id}, Nombre: ${campaign.nombre_campanha}`);
      console.log(`📋 [TEMPLATE] ID: ${campaign.template?.template_id}, Nombre: ${campaign.template?.nombre_template}`);
      console.log(`👥 [CLIENTS] Clientes a procesar: ${campaign.cliente_campanha?.length || 0}`);
    }

    if (!campaign) {
      console.error("❌ [ERROR] Campaña no encontrada con ID:", campaignId);
      return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    }

    if (!campaign.template?.nombre_template) {
      console.error("❌ [ERROR] Template inválido:", campaign.template);
      return NextResponse.json({ error: "Template inválido" }, { status: 400 });
    }

    // 🔍 VERIFICAR ESTADO DEL TEMPLATE EN META BUSINESS
    console.log("🔍 [TEMPLATE_CHECK] Verificando template en Meta Business...");
    try {
      const templateCheckUrl = `https://graph.facebook.com/v23.0/${META_BUSINESS_ACCOUNT_ID}/message_templates?name=${campaign.template.nombre_template}`;
      console.log(`🌐 [TEMPLATE_API] URL de verificación: ${templateCheckUrl}`);
      
      const templateResponse = await fetch(templateCheckUrl, {
        headers: {
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
        }
      });
      
      if (templateResponse.ok) {
        const templateData = await templateResponse.json();
        console.log(`📋 [TEMPLATE_DATA] Data del template:`, templateData);
        
        if (templateData.data && templateData.data.length > 0) {
          const template = templateData.data[0];
          console.log(`📊 [TEMPLATE_STATUS] Estado: ${template.status}`);
          console.log(`🏷️ [TEMPLATE_CATEGORY] Categoría: ${template.category}`);
          console.log(`🗣️ [TEMPLATE_LANGUAGE] Idioma: ${template.language}`);
          
          if (template.status !== 'APPROVED') {
            console.warn(`⚠️ [TEMPLATE_WARNING] Template '${campaign.template.nombre_template}' no está APROBADO. Estado actual: ${template.status}`);
            console.warn(`⚠️ [TEMPLATE_INFO] Los mensajes solo se entregan si el template está APROBADO en Meta Business.`);
          } else {
            console.log(`✅ [TEMPLATE_OK] Template '${campaign.template.nombre_template}' está APROBADO y listo para usar`);
          }
        }
      } else {
        console.warn(`⚠️ [TEMPLATE_CHECK_FAIL] No se pudo verificar el template (${templateResponse.status})`);
      }
    } catch (templateError) {
      console.warn(`⚠️ [TEMPLATE_CHECK_ERROR] Error verificando template:`, templateError.message);
    }

    console.log("✅ [VALIDATION] Validaciones básicas completadas");

    // Verificar variables de entorno
    console.log("🔐 [ENV] Verificando variables de entorno:");
    console.log(`📞 META_PHONE_NUMBER_ID: ${META_PHONE_NUMBER_ID ? 'CONFIGURADO' : 'FALTANTE'}`);
    console.log(`🔑 META_ACCESS_TOKEN: ${META_ACCESS_TOKEN ? 'CONFIGURADO' : 'FALTANTE'}`);
    console.log(`🏢 META_BUSINESS_ACCOUNT_ID: ${META_BUSINESS_ACCOUNT_ID ? 'CONFIGURADO' : 'FALTANTE'}`);

    if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) {
      console.error("❌ [ERROR] Variables de entorno de Meta Business API faltantes");
      return NextResponse.json({ error: "Configuración de Meta Business API incompleta" }, { status: 500 });
    }

    console.log("✅ [VALIDATION] Validaciones básicas completadas");

    // Verificar variables de entorno
    console.log("� [ENV] Verificando variables de entorno:");
    console.log(`📞 META_PHONE_NUMBER_ID: ${META_PHONE_NUMBER_ID ? 'CONFIGURADO' : 'FALTANTE'}`);
    console.log(`🔑 META_ACCESS_TOKEN: ${META_ACCESS_TOKEN ? 'CONFIGURADO' : 'FALTANTE'}`);
    console.log(`🏢 META_BUSINESS_ACCOUNT_ID: ${META_BUSINESS_ACCOUNT_ID ? 'CONFIGURADO' : 'FALTANTE'}`);

    if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) {
      console.error("❌ [ERROR] Variables de entorno de Meta Business API faltantes");
      return NextResponse.json({ error: "Configuración de Meta Business API incompleta" }, { status: 500 });
    }

    // �🚀 MEJORA 7: Logging estructurado
    const logger = {
      campaign: campaignId,
      template: campaign.template.nombre_template,
      totalClients: campaign.cliente_campanha.length,
      timestamp: new Date().toISOString()
    };

    console.log(`🎯 [${logger.timestamp}] Iniciando campaña ${campaignId}:`, logger);
    console.log(`📋 [MAPPINGS] Variable mappings:`, campaign.variable_mappings);

    const mappings = campaign.variable_mappings || {};

    // Verificar si hay clientes para procesar
    if (campaign.cliente_campanha.length === 0) {
      console.warn("⚠️ [WARNING] No hay clientes pendientes de envío");
      return NextResponse.json({ 
        success: true,
        message: "No hay clientes pendientes de envío",
        summary: {
          total: 0,
          sent: 0,
          failed: 0,
          campaignId
        }
      });
    }

    // 🚀 MEJORA 8: Procesamiento por lotes OPTIMIZADO con paralelismo
    const batches = [];
    for (let i = 0; i < campaign.cliente_campanha.length; i += RATE_LIMIT.batchSize) {
      batches.push(campaign.cliente_campanha.slice(i, i + RATE_LIMIT.batchSize));
    }

    console.log(`📦 Procesando ${batches.length} lotes de hasta ${RATE_LIMIT.batchSize} clientes cada uno`);
    console.log(`⚡ Configuración optimizada: ${RATE_LIMIT.messagesPerSecond} msg/seg, ${RATE_LIMIT.concurrentBatches} lotes paralelos`);

    // Procesar lotes en paralelo para máxima velocidad
    const processBatch = async (batch, batchIndex) => {
      console.log(`� Iniciando lote ${batchIndex + 1}/${batches.length} (${batch.length} clientes)`);
      const startTime = Date.now();

      const batchPromises = batch.map(async ({ cliente, cliente_campanha_id }) => {
        if (!cliente?.celular) {
          console.warn(`⚠ Cliente ${cliente?.nombre || "Desconocido"} sin número válido`);
          return null;
        }

        // Formatear número correctamente - CORREGIDO para evitar duplicación del 51
        let celularRaw = cliente.celular.toString().trim();
        console.log(`📞 [PHONE_RAW] Número original: "${celularRaw}"`);
        
        // Remover caracteres no numéricos (excepto el + inicial si existe)
        celularRaw = celularRaw.replace(/[^0-9+]/g, '').replace(/^\+/, '');
        console.log(`📞 [PHONE_CLEAN] Número limpio: "${celularRaw}"`);
        
        let celularFormatted;
        
        if (celularRaw.startsWith('51') && celularRaw.length === 11) {
          // Ya tiene código de país correcto
          celularFormatted = celularRaw;
          console.log(`📞 [PHONE_LOGIC] Ya tiene código 51: ${celularFormatted}`);
        } else if (celularRaw.startsWith('9') && celularRaw.length === 9) {
          // Número peruano de 9 dígitos empezando con 9
          celularFormatted = `51${celularRaw}`;
          console.log(`📞 [PHONE_LOGIC] Agregando 51 a número de 9 dígitos: ${celularFormatted}`);
        } else if (celularRaw.length >= 8 && celularRaw.length <= 9 && /^[0-9]+$/.test(celularRaw)) {
          // Número válido de 8-9 dígitos
          celularFormatted = `51${celularRaw}`;
          console.log(`📞 [PHONE_LOGIC] Agregando 51 a número válido: ${celularFormatted}`);
        } else {
          console.error(`❌ [PHONE_ERROR] Número inválido: "${celularRaw}"`);
          return {
            cliente_campanha_id,
            celular: celularRaw,
            cliente_id: cliente.cliente_id,
            success: false,
            status: "invalid_phone",
            errorCode: "INVALID_PHONE_FORMAT",
            errorMessage: `Número de teléfono inválido: ${celularRaw}`,
            attemptsMade: 0
          };
        }
        
        // Validar formato final
        if (!/^51[0-9]{9}$/.test(celularFormatted)) {
          console.error(`❌ [PHONE_VALIDATION] Formato final inválido: "${celularFormatted}"`);
          return {
            cliente_campanha_id,
            celular: celularFormatted,
            cliente_id: cliente.cliente_id,
            success: false,
            status: "invalid_phone",  
            errorCode: "INVALID_WHATSAPP_FORMAT",
            errorMessage: `Formato de WhatsApp inválido: ${celularFormatted}`,
            attemptsMade: 0
          };
        }
        
        console.log(`📞 [PHONE_FINAL] Número formateado final: "${celularFormatted}"`);

        // Rate limiting más agresivo
        await campaignManager.waitForRateLimit(campaignId);

        // Preparar mensaje usando PLANTILLA DE META BUSINESS
        console.log(`🎯 [MESSAGE_PREP] Preparando mensaje usando plantilla de Meta Business API`);
        console.log(`📋 [TEMPLATE_INFO] Nombre: ${campaign.template.nombre_template}, Parámetros: ${Object.keys(mappings).length}`);
        
        const messagePayload = campaignManager.prepareMessagePayload(
          campaign.template, cliente, mappings, celularFormatted
        );
        const mensajeFinal = campaignManager.processMessageText(
          campaign.template, cliente, mappings
        );
        
        console.log(`🚀 [SEND_TYPE] Enviando como TEMPLATE (no texto libre) para permitir mensajes a clientes nuevos`);

        // Enviar con reintentos optimizados
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
      const processingTime = (Date.now() - startTime) / 1000;
      const successfulInBatch = batchResults.filter(r => r?.success).length;
      
      console.log(`✅ Lote ${batchIndex + 1} completado en ${processingTime.toFixed(2)}s - Exitosos: ${successfulInBatch}/${batch.length}`);
      
      return batchResults.filter(r => r !== null);
    };

    // Procesar lotes con paralelismo controlado
    const allResults = [];
    for (let i = 0; i < batches.length; i += RATE_LIMIT.concurrentBatches) {
      const concurrentBatches = batches.slice(i, i + RATE_LIMIT.concurrentBatches);
      
      const concurrentPromises = concurrentBatches.map((batch, index) => 
        processBatch(batch, i + index)
      );

      const concurrentResults = await Promise.all(concurrentPromises);
      allResults.push(...concurrentResults.flat());

      // Pausa mínima entre grupos de lotes paralelos
      if (i + RATE_LIMIT.concurrentBatches < batches.length) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.pauseBetweenBatches));
      }

      // Log de progreso
      const processed = Math.min(i + RATE_LIMIT.concurrentBatches, batches.length);
      const progressPercent = ((processed / batches.length) * 100).toFixed(1);
      console.log(`📊 Progreso: ${processed}/${batches.length} lotes (${progressPercent}%)`);
    }

    const results = allResults;

    // 🚀 MEJORA 9: Actualizar campaña con estadísticas detalladas y métricas de rendimiento
    const totalProcessingTime = Date.now() - new Date(logger.timestamp).getTime();
    const stats = {
      total: results.length,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      errorBreakdown: results
        .filter(r => !r.success)
        .reduce((acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          return acc;
        }, {}),
      performance: {
        totalTimeMs: totalProcessingTime,
        totalTimeMinutes: (totalProcessingTime / 60000).toFixed(2),
        messagesPerSecond: (results.length / (totalProcessingTime / 1000)).toFixed(2),
        successRate: ((results.filter(r => r.success).length / results.length) * 100).toFixed(1)
      }
    };

    await prisma.campanha.update({
      where: { campanha_id: campaignId },
      data: { 
        estado_campanha: "enviada",
        fecha_fin: new Date(),
      },
    });

    console.log(`🚀 Campaña ${campaignId} completada en ${stats.performance.totalTimeMinutes} minutos:`, stats);
    console.log(`⚡ Rendimiento: ${stats.performance.messagesPerSecond} msg/seg - Éxito: ${stats.performance.successRate}%`);

    return NextResponse.json({ 
      success: true, 
      results,
      summary: {
        ...stats,
        campaignId,
        batchesProcessed: batches.length,
        configuration: {
          messagesPerSecond: RATE_LIMIT.messagesPerSecond,
          batchSize: RATE_LIMIT.batchSize,
          concurrentBatches: RATE_LIMIT.concurrentBatches
        }
      }
    });

  } catch (error) {
    console.error("💥 [CRITICAL_ERROR] Error crítico en campaña:", {
      campaignId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      error: "Error interno del servidor",
      errorDetails: error.message,
      campaignId: campaignId,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
