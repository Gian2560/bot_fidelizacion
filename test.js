require('dotenv').config();
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');

// Cargar credenciales desde variable de entorno
const key = JSON.parse(process.env.BIG_QUERY_KEY);

const storage = new Storage({
  credentials: key,
  projectId: key.project_id,
});

async function descargarArchivo() {
  try {
    const bucketName = 'frentes_2024';
    const filePath = '4-Reingresos/base_Asignacion/Filtrada/BD_Conglomerado.csv';
    const destinoLocal = './BD_Conglomerado.csv';

    console.log(`📥 Descargando ${filePath} desde el bucket ${bucketName}...`);
    await storage.bucket(bucketName).file(filePath).download({ destination: destinoLocal });

    console.log(`✅ Archivo descargado correctamente en ${destinoLocal}`);
  } catch (err) {
    console.error('❌ Error al descargar el archivo:', err.message);
  }
}

descargarArchivo();
