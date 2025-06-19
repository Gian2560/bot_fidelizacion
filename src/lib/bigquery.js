// lib/bigquery.js
import { BigQuery } from '@google-cloud/bigquery';

const bigquery = new BigQuery({
  projectId: 'peak-emitter-350713',
  keyFilename: './key/json.json',
});

export default bigquery;
