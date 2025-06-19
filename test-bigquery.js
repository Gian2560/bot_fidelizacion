const { BigQuery } = require('@google-cloud/bigquery');
const path = require('path');

async function main() {
  const bigquery = new BigQuery({
    projectId: 'peak-emitter-350713',
    keyFilename: path.join(__dirname, 'key', 'json.json'),
  });

  try {
    const [datasets] = await bigquery.getDatasets();

    for (const dataset of datasets) {
      console.log(`📁 Dataset: ${dataset.id}`);
      const [tables] = await dataset.getTables();

      if (tables.length === 0) {
        console.log('   ⚠️  No hay tablas en este dataset.\n');
        continue;
      }

      for (const table of tables) {
        console.log(`   📄 Tabla: ${table.id}`);
        try {
          const query = `SELECT * FROM \`${dataset.id}.${table.id}\` LIMIT 3`;
          const [rows] = await bigquery.query({ query });

          if (rows.length === 0) {
            console.log('      (Sin registros)');
          } else {
            rows.forEach((row, idx) => {
              console.log(`      Row ${idx + 1}:`, row);
            });
          }
        } catch (error) {
          console.log(`      ⚠️ Error al consultar: ${error.message}`);
        }
        console.log(); // salto de línea entre tablas
      }

      console.log('--------------------------------------');
    }
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

main();
