import { NextResponse } from "next/server";
import admin from "firebase-admin"; // Usar Firebase Admin para Firestore
import prisma from "@/lib/prisma"; // Prisma para la base de datos relacional (PostgreSQL)

// Inicializar Firestore si no está inicializado
let db;
try {
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS); // Credenciales de Firebase
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  db = admin.firestore();
} catch (error) {
  console.warn("⚠️ Firebase initialization failed:", error.message);
  // Continue without Firebase if credentials are not available
}

// Add CORS headers
function addCorsHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS(req) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

export async function POST(req, context) {
  try {
    console.log("📌 Iniciando creación de campaña...");

    const { nombre_campanha, descripcion, template_id, fecha_inicio, fecha_fin, clients } = await req.json();

    // Validación de datos y asignación de valores por defecto
    const finalFechaInicio = fecha_inicio ? new Date(fecha_inicio) : new Date(); // Si no se pasa fecha_inicio, se asigna la fecha actual
    const finalFechaFin = fecha_fin ? new Date(fecha_fin) : null; // Si no se pasa fecha_fin, se asigna null
    const finalDescripcion = descripcion || "Descripción no proporcionada"; // Valor predeterminado para descripcion
    const finalTemplateId = template_id || null; // Asignar null si no hay template_id
    const finalEstadoCampanha = "activa"; // Valor predeterminado de estado de la campaña
    const finalMensajeCliente = "Mensaje predeterminado"; // Mensaje predeterminado

    // Crear la campaña en Prisma (PostgreSQL)
    const campanha = await prisma.campanha.create({
      data: {
        nombre_campanha,
        descripcion: finalDescripcion,
        template_id: finalTemplateId, // Puede ser null si no se pasa el valor
        fecha_inicio: finalFechaInicio, // Convertir fecha a objeto Date
        fecha_fin: finalFechaFin, // Convertir fecha a objeto Date (o null si no se pasa)
        estado_campanha: finalEstadoCampanha,
        mensaje_cliente: finalMensajeCliente,
      },
    });

    // Verificar si se proporcionaron datos de clientes
    if (clients && Array.isArray(clients) && clients.length > 0) {
      const clientPromises = clients.map(async (clientData) => {
        const { 
          name, phone, state, reason, commercialAction, manager, 
          actions, segment, strategy, 
          document, documentType, surname, email, 
          noInterestCategory, noInterestDetail, 
          bound, observation, action, in_out, score 
        } = clientData;

        // Asignar valores por defecto si alguno de los campos de cliente es nulo
        const finalNombre = name || "Nombre desconocido";
        const finalCelular = phone ? phone.replace(/\s+/g, "") : "No proporcionado"; // Eliminar espacios del número
        const finalEstado = state || "Desconocido";
        const finalMotivo = reason || "Motivo no especificado";
        const finalAccionComercial = commercialAction || "Acción comercial no definida";
        const finalGestor = manager || "Gestor no asignado";
        const finalAccion = actions || "Acción no definida";
        const finalSegmento = segment || "Segmento no especificado";
        const finalEstrategia = strategy || "Estrategia no definida";
        const finalDocumentoIdentidad = document || "Documento no proporcionado";
        const finalTipoDocumento = documentType || "Tipo no especificado";
        const finalApellido = surname || "Apellido no proporcionado";
        const finalEmail = email || "noemail@example.com";
        const finalCategoriaNoInteres = noInterestCategory || "No interés";
        const finalDetalleNoInteres = noInterestDetail || "Sin detalles";
        const finalBound = bound ?? false;  // Definir como false si no se proporciona
        const finalObservacion = observation || "Sin observación";
        const finalInOut = in_out ?? false;  // Asignar false si no se pasa
        const finalScore = score || "no_score"; // Si no se pasa, asignar "no_score"

        // Verificar si el cliente ya existe en Prisma (PostgreSQL)
        let cliente = await prisma.cliente.findUnique({
          where: { celular: finalCelular }, // Buscar por el celular
        });        // Si el cliente no existe, crearlo
        if (!cliente) {
          console.log(`⚠️ Cliente con celular ${finalCelular} no encontrado, creando nuevo cliente.`);
          try {
            cliente = await prisma.cliente.create({
              data: {
                nombre: finalNombre,
                apellido: finalApellido,
                celular: finalCelular,
                email: finalEmail === "noemail@example.com" ? null : finalEmail, // No usar email dummy
                documento_identidad: finalDocumentoIdentidad === "Documento no proporcionado" ? null : finalDocumentoIdentidad,
                tipo_documento: finalTipoDocumento === "Tipo no especificado" ? null : finalTipoDocumento,
                categoria_no_interes: finalCategoriaNoInteres === "No interés" ? null : finalCategoriaNoInteres,
                detalle_no_interes: finalDetalleNoInteres === "Sin detalles" ? null : finalDetalleNoInteres,
                bound: finalBound,
                observacion: finalObservacion === "Sin observación" ? null : finalObservacion,
                gestor: finalGestor === "Gestor no asignado" ? null : finalGestor,
                accion: finalAccion === "Acción no definida" ? null : finalAccion,
                in_out: finalInOut,
                score: finalScore,
              },
            });
            console.log("✅ Cliente creado exitosamente: ", cliente);
          } catch (createError) {
            console.error("❌ Error al crear cliente:", createError);
            throw new Error(`Error al crear cliente ${finalNombre}: ${createError.message}`);
          }
        }        // Ahora que el cliente existe (o se ha creado), asociarlo a la campaña
        await prisma.cliente_campanha.create({
          data: {
            cliente_id: cliente.cliente_id,
            campanha_id: campanha.campanha_id, // Usar el campo correcto
          },
        });

        // Agregar el cliente a Firestore bajo la campaña recién creada (solo si Firebase está disponible)
        if (db) {
          try {
            const fecha = new Date();
            await db.collection("fidelizacion").doc(finalCelular).set({
              celular: finalCelular,
              fecha: admin.firestore.Timestamp.fromDate(fecha),
              id_bot: "fidelizacionbot",  // Bot de fidelización
              id_cliente: cliente.cliente_id,
              mensaje: "Mensaje inicial de la campaña",  // Mensaje de ejemplo o vacío
              sender: "false", // El primer mensaje lo manda el bot (false)
            });
            console.log(`✅ Cliente ${cliente.cliente_id} agregado a Firestore`);
          } catch (firebaseError) {
            console.warn(`⚠️ Error adding client to Firebase: ${firebaseError.message}`);
            // Continue without Firebase
          }
        }

        console.log(`✅ Cliente ${cliente.cliente_id} agregado a la campaña ${campanha.campanha_id}`);
      });

      // Esperamos que todos los clientes sean procesados
      await Promise.all(clientPromises);
    }    const response = NextResponse.json({
      message: "Campaña y clientes creados con éxito",
      campanha,
      clientsProcessed: clients?.length || 0,
    });
    
    return addCorsHeaders(response);
  } catch (error) {
    console.error("❌ Error al crear la campaña o agregar clientes:", error);
    const errorResponse = NextResponse.json({ 
      error: "Error al crear la campaña o agregar clientes",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
    
    return addCorsHeaders(errorResponse);
  }
}
