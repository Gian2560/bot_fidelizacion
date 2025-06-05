// Cargar las variables de entorno
require('dotenv').config();

const admin = require("firebase-admin");

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);  // Asegúrate de que las credenciales estén bien configuradas
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Función de prueba para consultar Firestore
async function testFirestore() {
  try {
    const celularFormatted = '+51 925162342'; // Usa un celular de ejemplo o el que quieras probar

    // Consulta a la colección fidelizacion
    const mensajesRef = db.collection("fidelizacion")
      .where("celular", "==", celularFormatted)
      .orderBy("fecha", "asc");

    // Obtener los mensajes
    const mensajesSnap = await mensajesRef.get();

    if (mensajesSnap.empty) {
      console.log("No hay mensajes para este cliente.");
      return;
    }

    const mensajes = mensajesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fecha: doc.data().fecha ? new Date(doc.data().fecha._seconds * 1000) : null, // Convertir fecha
    }));

    // Mostrar los mensajes formateados
    console.log("Mensajes obtenidos:");
    mensajes.forEach((msg, index) => {
      console.log(`Mensaje ${index + 1}:`);
      console.log("Contenido:", msg.mensaje);
      console.log("Fecha:", msg.fecha ? msg.fecha.toLocaleString() : "Fecha no disponible");
    });

  } catch (error) {
    console.error("Error al obtener los mensajes desde Firestore:", error);
  }
}

testFirestore();
