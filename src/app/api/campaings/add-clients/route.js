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
const normalizeAmountAsString = (val) => {
  if (val === null || val === undefined || val === "") return null;
  // quita símbolos y deja números, coma o punto
  return String(val).trim().replace(/[^\d.,-]/g, "");
};
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
    const body = await req.json();
    const { nombre_campanha, descripcion, template_id, fecha_inicio, fecha_fin, clients, variableMappings } = body;
    const seeds = [];
    // Validaciones básicas
    if (!nombre_campanha) {
      return NextResponse.json({ error: "nombre_campanha es requerido" }, { status: 400 });
    }
    
    if (!clients || !Array.isArray(clients)) {
      return NextResponse.json({ error: "clients debe ser un array" }, { status: 400 });
    }
    console.log(`Datos de mensaje del template_id: ${template_id}`);
    // Cargamos el mensaje base de la plantilla (una sola vez)
    let tplMensaje = ""
    if (template_id) {
      const tpl = await prisma.template.findUnique({
        where: { id: parseInt(template_id) }
      })
      tplMensaje = tpl?.mensaje || ""
    }
    
    // Preparar datos
    const finalFechaInicio = fecha_inicio ? new Date(fecha_inicio) : new Date();
    const finalFechaFin = fecha_fin ? new Date(fecha_fin) : null;
    const finalDescripcion = descripcion || "Descripción no proporcionada";
    const finalTemplateId = template_id ? parseInt(template_id) : null;
    const finalEstadoCampanha = "activa";
    const finalMensajeCliente = "Mensaje predeterminado";
    
    // OPTIMIZACIÓN 1: Preparar todos los números de teléfono de una vez
    const telefonos = clients.map(client => {
      const telefono = client.telefono;
      return telefono ? "+51" + telefono.toString().replace(/\s+/g, "") : null;
    }).filter(Boolean);
    
    const result = await prisma.$transaction(async (prisma) => {
      // Crear la campaña
      const campanha = await prisma.campanha.create({
        data: {
          nombre_campanha,
          descripcion: finalDescripcion,
          plantilla_id: finalTemplateId,
          fecha_inicio: finalFechaInicio,
          fecha_fin: finalFechaFin,
          estado_campanha: finalEstadoCampanha,
          mensaje_cliente: finalMensajeCliente,
          variable_mappings: variableMappings,
        },
      });

      if (clients.length > 0) {
        // OPTIMIZACIÓN 2: Obtener todos los clientes existentes de una vez
        const clientesExistentes = await prisma.cliente.findMany({
          where: {
            celular: { in: telefonos },
            NOT: { estado: { equals: "Enojado", mode: "insensitive" } },
          },
          select: {
            cliente_id: true,
            celular: true,
            estado: true
          }
        });

        // Crear mapa para búsqueda rápida
        const clientesMap = new Map(
          clientesExistentes.map(c => [c.celular, c])
        );

        // OPTIMIZACIÓN 3: Preparar datos para inserción masiva
        const clientesParaCrear = [];
        const asociacionesParaCrear = [];
        const firestoreOps = [];
        
        for (const clientData of clients) {
          const { nombre, telefono, email, monto,  feccuota, modelo, codpago, Cta_Act_Pag, Codigo_Asociado } = clientData;
          const finalNombre = nombre || "Nombre desconocido";
          const finalCelular = telefono ? "+51" + telefono.toString().replace(/\s+/g, "") : null;
          console.log("Procesando cliente:", email, finalCelular);
          const finalEmail = email && email.trim() !== "" ? email : null;
          const finalMonto = normalizeAmountAsString(monto) || 0;
          const finalFechaCuota = feccuota || "";
          const finalModelo = modelo || "";
          const finalCodPago = codpago || "";
          const finalCuotas = Cta_Act_Pag || 0;
          const finalCodAsociado = Codigo_Asociado || "";
          if (!finalCelular) continue;

          let cliente = clientesMap.get(finalCelular);

          // Validar si el cliente existe y su estado es "Enojado"
          if (cliente) {
            // Obtener el estado actual del cliente desde la base de datos
            const clienteActual = await prisma.cliente.findUnique({
              where: { cliente_id: cliente.cliente_id },
              select: { estado: true }
            });
            if (clienteActual?.estado?.trim() === "Enojado") {
              // Saltar este cliente, no se actualiza ni se agrega a la campaña
              continue;
            }
            // Cliente ya existe y no está "Enojado": actualizar sus campos
            await prisma.cliente.update({
              where: { cliente_id: cliente.cliente_id },
              data: {
                feccuota: finalFechaCuota,
                modelo: finalModelo,
                codpago: finalCodPago,
                Cta_Act_Pag: finalCuotas,
                codigo_asociado: finalCodAsociado,
                monto: finalMonto
              }
            });
          } else {
            // Cliente nuevo: lo metemos en el array para createMany
            clientesParaCrear.push({
              nombre: finalNombre,
              celular: finalCelular,
              email: finalEmail,
              categoria_no_interes: " ",
              bound: false,
              estado: " ",
              observacion: "Observación no proporcionada",
              score: "no_score",
              feccuota: finalFechaCuota,
              modelo: finalModelo,
              codpago: finalCodPago,
              Cta_Act_Pag: finalCuotas,
              codigo_asociado: finalCodAsociado,
              monto: finalMonto
            });
          }
        }

        // OPTIMIZACIÓN 4: Inserción masiva de clientes nuevos
        let clientesCreados = [];
        if (clientesParaCrear.length > 0) {
          clientesCreados = await prisma.cliente.createManyAndReturn({
            data: clientesParaCrear
          });
        }

        // Crear mapa completo con clientes nuevos y existentes
        const todosClientes = new Map(clientesMap);
        clientesCreados.forEach(c => todosClientes.set(c.celular, c));

        // OPTIMIZACIÓN 5: Preparar asociaciones y operaciones Firestore
        const fecha = new Date();
        const firestoreBatch = db ? db.batch() : null;
        

        for (const clientData of clients) {
          const { telefono } = clientData;
          const finalCelular = telefono ? "+51" + telefono.toString().replace(/\s+/g, "") : null;
          if (!finalCelular) continue;

          const cliente = todosClientes.get(finalCelular);
          if (!cliente) continue;

          // Validar si el cliente tiene estado "Enojado" antes de asociar a la campaña
          const clienteActual = await prisma.cliente.findUnique({
            where: { cliente_id: cliente.cliente_id },
            select: { estado: true }
          });
          if (clienteActual?.estado?.trim() === "Enojado") {
            // Saltar este cliente, no se asocia ni se agrega a Firestore
            continue;
          }

          // Preparar asociación
          asociacionesParaCrear.push({
            cliente_id: cliente.cliente_id,
            campanha_id: campanha.campanha_id,
          });

          // Preparar mensaje personalizado
          let mensajePersonalizado = tplMensaje;
          for (const [idx, campo] of Object.entries(variableMappings || {})) {
            const valor = clientData[campo] || "";
            mensajePersonalizado = mensajePersonalizado.replace(
              new RegExp(`{{\\s*${idx}\\s*}}`, "g"),
              valor
            );
          }
          // --- Agregar seed para el checkpointer del hilo f-{phone} ---
         // OJO: thread_id en el bot usa número sin '+', por eso lo quitamos aquí
          seeds.push({
            phone: (finalCelular || "").replace(/^\+/, ""),   // "519..." (sin '+')
            text: mensajePersonalizado,
            role: "ai"
          });
          // Preparar operación Firestore en batch
          if (firestoreBatch) {
            const docRef = db.collection("fidelizacion").doc(finalCelular);
            firestoreBatch.set(docRef, {
              celular: finalCelular,
              fecha: admin.firestore.Timestamp.fromDate(fecha),
              id_bot: "fidelizacionbot",
              id_cliente: cliente.cliente_id,
              mensaje: mensajePersonalizado || "Mensaje inicial de la campaña",
              sender: "false",
            });
          }
        }

        // OPTIMIZACIÓN 6: Inserción masiva de asociaciones
        if (asociacionesParaCrear.length > 0) {
          await prisma.cliente_campanha.createMany({
            data: asociacionesParaCrear,
            skipDuplicates: true
          });
        }

        // OPTIMIZACIÓN 7: Ejecutar todas las operaciones Firestore en batch
        if (firestoreBatch) {
          await firestoreBatch.commit();
        }
      }

      return {
        campanha,
        clientsProcessed: clients.length,
      };
    },
    {
    timeout: 200000,
    maxWait: 20000
  }
  );

  // --- Llamada única al bot para sembrar memoria en el checkpointer ---
  // --- Llamada única al bot para sembrar memoria en el checkpointer ---
try {
  if (!seeds.length) {
    console.log("🌱 No hay seeds para enviar.");
  } else {
    const BOT_URL = "https://cloudbot-763512810578.us-west4.run.app";
    const resp = await fetch(`${BOT_URL}/seed-campaign-memory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "append", entries: seeds }),
    });

    let bodyOnce = null; // leemos una sola vez
    const ct = resp.headers.get("content-type") || "";

    if (ct.includes("application/json")) {
      bodyOnce = await resp.json().catch(() => null);
    } else {
      bodyOnce = await resp.text().catch(() => null);
    }

    if (!resp.ok) {
      console.warn("⚠️ Seeding falló:", resp.status, bodyOnce);
    } else {
      console.log("🌱 Seeding OK:", bodyOnce);
    }
  }
} catch (e) {
  console.warn("⚠️ No se pudo sembrar el checkpointer:", e?.message || e);
}


    const response = NextResponse.json({
      message: "Campaña y clientes creados con éxito",
      campanha: result.campanha,
      clientsProcessed: result.clientsProcessed,
    });

    return addCorsHeaders(response);
    
  } catch (error) {
    console.error("❌ Error:", error);
    const errorResponse = NextResponse.json({
      error: "Error al crear la campaña o agregar clientes",
      details: error.message,
    }, { status: 500 });

    return addCorsHeaders(errorResponse);
  }
}
