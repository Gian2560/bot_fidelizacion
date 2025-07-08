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
  try {
    console.log("📥 Iniciando POST request...");
    
    const body = await req.json();
    console.log("📋 Request body:", body);
    
    const { nombre_campanha, descripcion, template_id, fecha_inicio, fecha_fin, clients, variableMappings } = body;
    
    // Validaciones básicas
    if (!nombre_campanha) {
      return NextResponse.json({ error: "nombre_campanha es requerido" }, { status: 400 });
    }
    
    if (!clients || !Array.isArray(clients)) {
      return NextResponse.json({ error: "clients debe ser un array" }, { status: 400 });
    }
    
    console.log("🔍 Validaciones básicas completadas");
    
    // Cargamos el mensaje base de la plantilla
    let tplMensaje = ""
    if (template_id) {
      console.log("🔍 Buscando template con ID:", template_id);
      const tpl = await prisma.template.findUnique({
        where: { id: parseInt(template_id) }
      })
      tplMensaje = tpl?.mensaje || ""
      console.log("📝 Template encontrado:", tpl ? "Sí" : "No");
    }
    
    // Validación de datos y asignación de valores por defecto
    const finalFechaInicio = fecha_inicio ? new Date(fecha_inicio) : new Date();
    const finalFechaFin = fecha_fin ? new Date(fecha_fin) : null;
    const finalDescripcion = descripcion || "Descripción no proporcionada";
    const finalTemplateId = template_id ? parseInt(template_id) : null;
    const finalEstadoCampanha = "activa";
    const finalMensajeCliente = "Mensaje predeterminado";
    console.log("Datos de la campaña:", { clientsCount: clients.length });
    
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
      console.log("Clientes:", clients.length);
      if (clients.length > 0) {
        console.log(`Procesando ${clients.length} clientes...`);

        // Crear los clientes
        const clientPromises = clients.map(async (clientData) => {
          
          const { nombre, telefono, mail } = clientData;
          const finalNombre = nombre || "Nombre desconocido";  // Obligatorio
          const finalCelular = telefono ? "+51" + telefono.toString().replace(/\s+/g, "") : "No proporcionado"; // Obligatorio, agregar +51 si no está
          const finalEmail = mail || "noemail@example.com"; // Opcional

          // Verificar si el cliente ya existe en Prisma
          let cliente = await prisma.cliente.findFirst({
            where: { celular: finalCelular },
          });
          
          console.log("Verificando cliente:", finalCelular);
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
          
          // Generar mensaje personalizado
          let mensajePersonalizado = tplMensaje
          for (const [idx, campo] of Object.entries(variableMappings || {})) {
            const valor = clientData[campo] || ""
            mensajePersonalizado = mensajePersonalizado.replace(
              new RegExp(`{{\\s*${idx}\\s*}}`, "g"),
              valor
            )
          }
          
          // Agregar el cliente a Firestore
          if (db) {
            const fecha = new Date();
            await db.collection("fidelizacion").doc(finalCelular).set({
              celular: finalCelular,
              fecha: admin.firestore.Timestamp.fromDate(fecha),
              id_bot: "fidelizacionbot",
              id_cliente: cliente.cliente_id,
              mensaje: mensajePersonalizado || "Mensaje inicial de la campaña",
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
