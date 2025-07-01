import { NextResponse } from "next/server";
import admin from "firebase-admin"; // Usar Firebase Admin para Firestore
import prisma from "@/lib/prisma"; // Prisma para la base de datos relacional (PostgreSQL)

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
  const { nombre_campanha, descripcion, template_id, fecha_inicio, fecha_fin, clients } = await req.json();

  // Validación de datos y asignación de valores por defecto
  const finalFechaInicio = fecha_inicio ? new Date(fecha_inicio) : new Date();
  const finalFechaFin = fecha_fin ? new Date(fecha_fin) : null;
  const finalDescripcion = descripcion || "Descripción no proporcionada";
  const finalTemplateId = template_id || null;
  const finalEstadoCampanha = "activa";
  const finalMensajeCliente = "Mensaje predeterminado";
  console.log("Datos de la campaña:", { clients });
  try {
    // Inicia la transacción
    const result = await prisma.$transaction(async (prisma) => {
      // Crear la campaña en Prisma (PostgreSQL)
      const campanha = await prisma.campanha.create({
        data: {
          nombre_campanha,
          descripcion: finalDescripcion,
          template_id: finalTemplateId,
          fecha_inicio: finalFechaInicio,
          fecha_fin: finalFechaFin,
          estado_campanha: finalEstadoCampanha,
          mensaje_cliente: finalMensajeCliente,
        },
      });

      // Verificar si se proporcionaron datos de clientes
      if (clients) {
        console.log(`Procesando ${clients} clientes...`);

        // Crear los clientes
        const clientPromises = clients.map(async (clientData) => {
          const {
            Codigo_Asociado, codpago, fecCuota, mail, modelo, monto, nombre, segmentacion, telefono
          } = clientData;
          const finalNombre = nombre || "Nombre desconocido";  // Obligatorio
const finalCelular = telefono ? "+51" + telefono.toString().replace(/\s+/g, "") : "No proporcionado"; // Obligatorio, agregar +51 si no está
const finalEmail = mail || "noemail@example.com"; // Opcional
const finalSegmento = segmentacion || "Segmento no especificado"; // Opcional
const finalCodigoAsociado = codpago || "Código no proporcionado"; // Opcional
const finalFechaCuota = fecCuota || "Fecha no proporcionada"; // Opcional
const finalMonto = monto || 0; // Opcional

// Campos obligatorios según el esquema de cliente
const finalCategoriaNoInteres = "No interés"; // Definido en tu esquema, no nulo
const finalObservacion = "Observación no proporcionada"; // Valor predeterminado
const finalEstado = "activo"; // Campo obligatorio, si no se pasa, asignamos el valor por defecto
const finalScore = "no_score"; // Valor predeterminado de score

          // Verificar si el cliente ya existe en Prisma
          let cliente = await prisma.cliente.findUnique({
            where: { celular: finalCelular },
          });

          if (!cliente) {
            console.log(`⚠️ Cliente con celular ${finalCelular} no encontrado, creando nuevo cliente.`);
            try {
  console.log("📌 Creando cliente...");
  cliente = await prisma.cliente.create({
    data: {
      nombre: finalNombre,
      celular: finalCelular,
      email: finalEmail === "noemail@example.com" ? null : finalEmail,
      categoria_no_interes: "No interés",
      bound: false,
      estado: "activo",
      observacion: "Observación no proporcionada",
      score: "no_score",
    },
  });
  console.log("✅ Cliente creado exitosamente:", cliente);
} catch (createError) {
  console.error("❌ Error al crear cliente:", createError);
  throw new Error(`Error al crear cliente ${finalNombre}: ${createError.message}`);
}
          }

          // Asociar el cliente con la campaña
          await prisma.cliente_campanha.create({
            data: {
              cliente_id: cliente.cliente_id,
              campanha_id: campanha.campanha_id,
            },
          });

          // Agregar el cliente a Firestore
          if (db) {
            const fecha = new Date();
            await db.collection("fidelizacion").doc(finalCelular).set({
              celular: finalCelular,
              fecha: admin.firestore.Timestamp.fromDate(fecha),
              id_bot: "fidelizacionbot",
              id_cliente: cliente.cliente_id,
              mensaje: "Mensaje inicial de la campaña",
              sender: "false",
            });
            console.log(`✅ Cliente ${cliente.cliente_id} agregado a Firestore`);
          }

          console.log(`✅ Cliente ${cliente.cliente_id} agregado a la campaña ${campanha.campanha_id}`);
        });

        // Esperamos a que todos los clientes sean procesados
        await Promise.all(clientPromises);
      }

      // Devuelvo el resultado de la campaña y la cantidad de clientes procesados
      return {
        campanha,
        clientsProcessed: clients?.length || 0,
      };
    });

    // Si todo ha ido bien, retornamos el resultado
    const response = NextResponse.json({
      message: "Campaña y clientes creados con éxito",
      campanha: result.campanha,
      clientsProcessed: result.clientsProcessed,
    });

    return addCorsHeaders(response);
  } catch (error) {
    console.error("❌ Error al crear la campaña o agregar clientes:", error);
    const errorResponse = NextResponse.json({
      error: "Error al crear la campaña o agregar clientes",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });

    return addCorsHeaders(errorResponse);
  }
}
