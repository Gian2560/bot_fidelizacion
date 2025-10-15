import axios from 'axios';

// Configuración de Meta WhatsApp Business API
const META_API_VERSION = 'v21.0';
const WHATSAPP_BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

/**
 * Extraer parámetros de un texto ({{1}}, {{2}}, etc.)
 * @param {string} text - Texto con parámetros
 * @returns {Array<number>} - Array de números de parámetros
 */
function extraerParametros(text) {
  if (!text) return [];
  const matches = text.match(/\{\{(\d+)\}\}/g);
  if (!matches) return [];
  return matches.map(m => parseInt(m.replace(/\{\{|\}\}/g, '')));
}

/**
 * Generar ejemplos automáticos para los parámetros
 * @param {Array<number>} parametros - Array de números de parámetros
 * @returns {Array<string>} - Array de ejemplos
 */
function generarEjemplos(parametros) {
  const ejemplosPorDefecto = [
    'Juan Pérez',      // {{1}}
    'Maqui Sistemas',  // {{2}}
    '15 de octubre',   // {{3}}
    'S/ 1,500.00',     // {{4}}
    '3 días',          // {{5}}
    '2024',            // {{6}}
    'Lima',            // {{7}}
    '15:00',           // {{8}}
    '912345678',       // {{9}}
    'ejemplo@mail.com' // {{10}}
  ];
  
  return parametros.map(num => ejemplosPorDefecto[num - 1] || `Ejemplo ${num}`);
}

/**
 * Crear una plantilla de mensaje en Meta WhatsApp Business
 * @param {Object} templateData - Datos de la plantilla
 * @returns {Promise<Object>} - Respuesta de Meta con el ID y estado
 */
export async function createMetaTemplate(templateData) {
  try {
    const { 
      nombre, 
      mensaje, 
      categoria = 'MARKETING', 
      idioma = 'es_PE',
      ejemplos_mensaje,
      ejemplos_header 
    } = templateData;

    // Construir el componente BODY
    const bodyComponent = {
      type: 'BODY',
      text: mensaje
    };

    // Usar ejemplos proporcionados por el usuario para el mensaje
    if (ejemplos_mensaje && ejemplos_mensaje.length > 0) {
      bodyComponent.example = {
        body_text: [ejemplos_mensaje]
      };
    }

    // Construir el cuerpo de la plantilla según formato de Meta
    const metaTemplateBody = {
      name: nombre.toLowerCase().replace(/\s+/g, '_'), // Meta requiere nombres en snake_case
      language: idioma,
      category: categoria, // MARKETING, UTILITY, AUTHENTICATION
      components: [bodyComponent]
    };

    // Si tiene header, agregarlo al inicio con sus ejemplos
    if (templateData.header) {
      const headerComponent = {
        type: 'HEADER',
        format: templateData.headerFormat || 'TEXT',
        text: templateData.header
      };
      
      // Usar ejemplos proporcionados por el usuario para el header
      if (ejemplos_header && ejemplos_header.length > 0) {
        headerComponent.example = {
          header_text: ejemplos_header
        };
      }
      
      metaTemplateBody.components.unshift(headerComponent);
    }

    // Si tiene footer, agregarlo
    if (templateData.footer) {
      metaTemplateBody.components.push({
        type: 'FOOTER',
        text: templateData.footer
      });
    }

    // Si tiene botones, agregarlos
    if (templateData.botones && templateData.botones.length > 0) {
      metaTemplateBody.components.push({
        type: 'BUTTONS',
        buttons: templateData.botones.map(btn => ({
          type: btn.type || 'QUICK_REPLY',
          text: btn.text
        }))
      });
    }

    // Validar ratio de parámetros vs longitud del mensaje
    const parametrosMensaje = extraerParametros(mensaje);
    const longitudMensaje = mensaje.length;
    const ratioParametros = parametrosMensaje.length / longitudMensaje;
    
    console.log(`📊 Análisis de plantilla: ${parametrosMensaje.length} parámetros, ${longitudMensaje} caracteres, ratio: ${ratioParametros.toFixed(3)}`);
    
    if (ratioParametros > 0.15) {
      console.warn('⚠️ Ratio alto de parámetros. Meta puede rechazar esta plantilla.');
    }

    console.log('📤 Creando plantilla en Meta:', JSON.stringify(metaTemplateBody, null, 2));

    const response = await axios.post(
      `https://graph.facebook.com/${META_API_VERSION}/${WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
      metaTemplateBody,
      {
        headers: {
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Plantilla creada en Meta:', response.data);

    return {
      success: true,
      meta_id: response.data.id,
      nombre_meta: metaTemplateBody.name,
      estado: response.data.status || 'PENDING', // PENDING, APPROVED, REJECTED
      mensaje: 'Plantilla creada exitosamente en Meta. Pendiente de aprobación.'
    };

  } catch (error) {
    console.error('❌ Error al crear plantilla en Meta:', JSON.stringify(error.response?.data || error.message, null, 2));
    
    // 🔍 Debug: mostrar estructura del error de Meta
    if (error.response?.data?.error) {
      console.log('🔍 Meta error structure:', {
        message: error.response.data.error.message,
        error_user_msg: error.response.data.error.error_user_msg,
        error_user_title: error.response.data.error.error_user_title,
        error_subcode: error.response.data.error.error_subcode
      });
    }
    
    let errorMessage = error.response?.data?.error?.message || error.message;
    
    // Usar el mensaje original de Meta (no traducir)
    let userMessage = error.response?.data?.error?.error_user_msg || errorMessage;
    
    return {
      success: false,
      error: userMessage,
      error_original: errorMessage,
      error_code: error.response?.data?.error?.code,
      error_subcode: error.response?.data?.error?.error_subcode,
      // Pasar el error_user_msg directamente para el frontend
      error_user_msg: error.response?.data?.error?.error_user_msg,
      error_user_title: error.response?.data?.error?.error_user_title,
      detalles: error.response?.data
    };
  }
}

/**
 * Obtener el estado de una plantilla en Meta
 * @param {string} templateName - Nombre de la plantilla en Meta
 * @returns {Promise<Object>} - Estado de la plantilla
 */
export async function getMetaTemplateStatus(templateName) {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/${META_API_VERSION}/${WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
      {
        params: {
          name: templateName
        },
        headers: {
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`
        }
      }
    );

    if (response.data.data && response.data.data.length > 0) {
      const template = response.data.data[0];
      return {
        success: true,
        nombre: template.name,
        estado: template.status, // PENDING, APPROVED, REJECTED
        idioma: template.language,
        categoria: template.category,
        meta_id: template.id
      };
    } else {
      return {
        success: false,
        error: 'Plantilla no encontrada en Meta'
      };
    }

  } catch (error) {
    console.error('❌ Error al consultar estado en Meta:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
}

/**
 * Obtener todas las plantillas de Meta
 * @returns {Promise<Array>} - Lista de plantillas
 */
export async function getAllMetaTemplates() {
  try {
    // IMPORTANTE: Las plantillas pertenecen a la WABA (WhatsApp Business Account), 
    // NO al Phone Number ID
    const response = await axios.get(
      `https://graph.facebook.com/${META_API_VERSION}/${WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
      {
        params: {
          limit: 100000,
          fields: 'name,status,language,category,id,components'
        },
        headers: {
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`
        }
      }
    );

    console.log(`✅ Plantillas obtenidas de Meta: ${response.data.data?.length || 0}`);

    return {
      success: true,
      plantillas: response.data.data.map(t => ({
        id: t.id,
        nombre: t.name,
        estado_meta: t.status,
        idioma: t.language,
        categoria: t.category,
        meta_id: t.id,
        nombre_meta: t.name,
        // Extraer el mensaje del componente BODY si existe
        mensaje_cliente: t.components?.find(c => c.type === 'BODY')?.text || '',
        header: t.components?.find(c => c.type === 'HEADER')?.text || null,
        footer: t.components?.find(c => c.type === 'FOOTER')?.text || null,
        created_at: new Date().toISOString()
      }))
    };

  } catch (error) {
    console.error('❌ Error al obtener plantillas de Meta:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      plantillas: []
    };
  }
}

/**
 * Eliminar una plantilla de Meta
 * @param {string} templateName - Nombre de la plantilla
 * @returns {Promise<Object>} - Resultado de la eliminación
 */
export async function deleteMetaTemplate(templateName) {
  try {
    const response = await axios.delete(
      `https://graph.facebook.com/${META_API_VERSION}/${WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
      {
        params: {
          name: templateName
        },
        headers: {
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`
        }
      }
    );

    console.log('✅ Plantilla eliminada de Meta:', templateName);

    return {
      success: true,
      mensaje: 'Plantilla eliminada de Meta'
    };

  } catch (error) {
    console.error('❌ Error al eliminar plantilla de Meta:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
}
