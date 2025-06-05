import { NextResponse } from "next/server";
import admin from "firebase-admin"; // Usar Firebase Admin para Firestore
import prisma from "@/lib/prisma"; // Prisma para la base de datos relacional (PostgreSQL)

// Inicializar Firestore si no está inicializado
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS); // Credenciales de Firebase
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export async function POST(req, context) {
  try {
    console.log("📌 Iniciando creación de campaña...");

    const { nombre_campanha, descripcion, template_id, fecha_fin, clients } = await req.json();
    
    // Crear la campaña en Prisma (PostgreSQL)
    const campanha = await prisma.campanha.create({
      data: {
        nombre_campanha,
        descripcion,
        template_id: template_id || null, // Se asigna el template_id si existe
        fecha_fin: new Date(fecha_fin), // Convertir fecha a objeto Date
      },
    });

    // Verificar si se proporcionaron datos de clientes
    if (clients && Array.isArray(clients) && clients.length > 0) {
      const clientPromises = clients.map(async (clientData) => {
        const { nombre, celular, estado, motivo, accion_comercial, gestor } = clientData;

        // Verificar si el cliente ya existe en Prisma (PostgreSQL)
        let cliente = await prisma.cliente.findUnique({
          where: { celular: celular }, // Buscar por el celular
        });

        // Si el cliente no existe, crearlo
        if (!cliente) {
          console.log(`⚠️ Cliente con celular ${celular} no encontrado, creando nuevo cliente.`);
          cliente = await prisma.cliente.create({
            data: {
              nombre,
              celular,
              estado,
              motivo,
              accion_comercial,
              gestor,
            },
          });
        }

        // Ahora que el cliente existe (o se ha creado), asociarlo a la campaña
        await prisma.cliente_campanha.create({
          data: {
            cliente_id: cliente.cliente_id,
            campanha_id: campanha.id,
          },
        });

        // Agregar el cliente a Firestore bajo la campaña recién creada
        // Insertar los datos de cliente en la colección 'fidelizacion'
        const fecha = new Date();
        await db.collection("fidelizacion").doc(celular).set({
          celular: celular,
          fecha: admin.firestore.Timestamp.fromDate(fecha),
          id_bot: "fidelizacionbot",  // Bot de fidelización
          id_cliente: cliente.cliente_id,
          mensaje: "Mensaje inicial de la campaña",  // Mensaje de ejemplo o vacío
          sender: "false", // El primer mensaje lo manda el bot (false)
        });

        console.log(`✅ Cliente ${cliente.cliente_id} agregado a la campaña ${campanha.id} en Firestore`);
      });

      // Esperamos que todos los clientes sean procesados
      await Promise.all(clientPromises);
    }

    return NextResponse.json({
      message: "Campaña y clientes creados con éxito",
      campanha,
    });
  } catch (error) {
    console.error("❌ Error al crear la campaña o agregar clientes:", error);
    return NextResponse.json({ error: "Error al crear la campaña o agregar clientes" }, { status: 500 });
  }
}
