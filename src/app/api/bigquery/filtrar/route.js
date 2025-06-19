import bq from '@/lib/bigquery';

/* ── 1. Normaliza el tipo al formato oficial de BigQuery ── */
const normalizeType = (t = 'STRING') => ({
  STRING: 'STRING', BYTES: 'BYTES',
  BOOL: 'BOOL', BOOLEAN: 'BOOL',
  INT64: 'INT64', INTEGER: 'INT64',
  FLOAT64: 'FLOAT64', FLOAT: 'FLOAT64', DOUBLE: 'FLOAT64',
  NUMERIC: 'NUMERIC', BIGNUMERIC: 'BIGNUMERIC',
  DATE: 'DATE', TIME: 'TIME', DATETIME: 'DATETIME', TIMESTAMP: 'TIMESTAMP',
}[t.toUpperCase()] || 'STRING');

/* ── 2. Cache de esquema por tabla ───────────────────────── */
const schemaCache = new Map();         // { 'proyecto.dataset.tabla' → { col:type,… } }

async function getSchema(project, dataset, table) {
  const key = `${project}.${dataset}.${table}`;
  if (schemaCache.has(key)) return schemaCache.get(key);

  const sql = `
    SELECT column_name, data_type
    FROM   \`${project}.${dataset}.INFORMATION_SCHEMA.COLUMNS\`
    WHERE  table_name = @tbl
  `;
  const [rows] = await bq.query({
    query: sql,
    params: { tbl: table },
    parameterMode: 'named',
  });

  const dict = {};
  rows.forEach(r => { dict[r.column_name] = normalizeType(r.data_type); });
  schemaCache.set(key, dict);
  return dict;
}

/* ── 3. POST /api/filtrar ────────────────────────────────── */
export async function POST(req) {
  try {
    const { table, filters } = await req.json();
    if (!table || !Array.isArray(filters))
      return new Response('Payload inválido', { status: 400 });

    /* Ajusta aquí si cambian proyecto/dataset */
    const project = 'peak-emitter-350713';
    const dataset = 'FR_RetFid_output';

    const schema = await getSchema(project, dataset, table);

    /* 3.1 WHERE y params primitivos */
    const params = {};          // { val0: 'ALTA', val1: 'convencional', val2: 0.72 }
    const whereParts = [];

    filters.forEach((f, idx) => {
      const p       = `val${idx}`;
      const colName = f.column.name;
      const colType = schema[colName] || 'STRING';

      // convierte a número si la columna es numérica
      let val = f.value;
      if (colType === 'INT64')   val = Number.parseInt(val, 10);
      if (colType === 'FLOAT64') val = Number.parseFloat(val);
      console.log(`Columna: ${colName}, Tipo: ${colType}, Valor: ${val}`);
      params[p] = val;                          // se guarda como PRIMITIVO
      whereParts.push(`\`${colName}\` = @${p}`);
    });

    const whereSQL = whereParts.join(' AND ') || '1=1';
    
    /* 3.2 columnas extra con alias legibles */
    const ALIAS = { segmentacion: 'segmento', cluster: 'cluster', estrategia: 'estrategia' };
    const selectExtra = filters
      .map(f => `\`${f.column.name}\` AS ${ALIAS[f.type] || f.column.name}`)
      .join(', ');

    /* 3.3 consulta final con JOIN */
    const QUERY = `
  WITH base AS (
    SELECT N_Doc, ${selectExtra}
    FROM   \`${project}.${dataset}.${table}\`
    WHERE  ${whereSQL}
  )
  SELECT  b.*,
          d.Primer_Nombre,
          d.TelfSMS,
          d.email
  FROM    base b
  INNER JOIN \`${project}.FR_general.envios_cobranzas_m0\` d
         ON CONCAT(CAST(b.N_Doc AS STRING), ',') = d.N_Doc
`;
    console.log('Consulta SQL:', QUERY);

    /* 3.4 ejecutar */
    const [rows] = await bq.query({
      query: QUERY,
      params,
      parameterMode: 'named',
    });

    return Response.json({ rows });         // 200 OK
  } catch (err) {
    console.error('Error en /api/filtrar:', err);
    return new Response('Error ejecutando consulta', { status: 500 });
  }
}
