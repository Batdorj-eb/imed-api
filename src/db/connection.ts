import pg from "pg";
import { config } from "../config/index.js";

const pool = new pg.Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  max: 10,
});

export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const result = await pool.query(sql, params);
  return result.rows as T;
}

export async function getClient() {
  const client = await pool.connect();
  return client;
}

export default pool;
