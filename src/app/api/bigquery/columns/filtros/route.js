// app/api/bigquery/filtro/route.js

  import bigquery from '@/lib/bigquery';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const projectId = 'peak-emitter-350713'; // Project ID fijo
    const datasetId = 'FR_RetFid_output'; // Dataset ID fijo
    const tableName = url.searchParams.get('database'); // Tabla seleccionada
    const segmentColumn = url.searchParams.get('segmentColumn'); // Columna Segmento
    const clusterColumn = url.searchParams.get('clusterColumn'); // Columna Cluster
    const estrategiaColumn = url.searchParams.get('estrategiaColumn'); // Columna Estrategia

    if (!tableName || !segmentColumn || !clusterColumn || !estrategiaColumn) {
      return new Response(
        JSON.stringify({
          message: '❌ Faltaron parámetros de tabla o columnas',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Consultas para obtener los valores únicos de cada columna
    const querySegmento = `
      SELECT DISTINCT \`${segmentColumn}\`
      FROM \`${projectId}.${datasetId}.${tableName}\`
    `;
    const queryCluster = `
      SELECT DISTINCT \`${clusterColumn}\`
      FROM \`${projectId}.${datasetId}.${tableName}\`
    `;
    const queryEstrategia = `
      SELECT DISTINCT \`${estrategiaColumn}\`
      FROM \`${projectId}.${datasetId}.${tableName}\`
    `;

    // Ejecutar las tres consultas SQL
    const [rowsSegmento] = await bigquery.query({ query: querySegmento });
    const [rowsCluster] = await bigquery.query({ query: queryCluster });
    const [rowsEstrategia] = await bigquery.query({ query: queryEstrategia });

    // Obtener los valores únicos de cada columna
    const uniqueSegmentos = rowsSegmento.map((row) => row[segmentColumn]);
    const uniqueClusters = rowsCluster.map((row) => row[clusterColumn]);
    const uniqueEstrategias = rowsEstrategia.map((row) => row[estrategiaColumn]);

    return new Response(
      JSON.stringify({
        message: '✅ Valores obtenidos correctamente',
        segmentos: uniqueSegmentos,
        clusters: uniqueClusters,
        estrategias: uniqueEstrategias,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('❌ Error al obtener los valores únicos:', error.message);

    return new Response(
      JSON.stringify({
        message: '❌ Error al obtener los valores únicos',
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
