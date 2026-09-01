import mysql, { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

type QueryParam = string | number | boolean | null | Date;

const globalForDb = globalThis as unknown as { dbPool?: Pool };

function createPool(): Pool {
  return mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'greenhouse_db',
    waitForConnections: true,
    connectionLimit: 10,
    timezone: 'Z',
  });
}

export const pool = globalForDb.dbPool ?? createPool();
if (process.env.NODE_ENV !== 'production') globalForDb.dbPool = pool;

export const DEFAULT_DEVICE_ID = Number(process.env.DEFAULT_DEVICE_ID || 1);

export async function query<T extends RowDataPacket[]>(
  sql: string,
  params: QueryParam[] = []
): Promise<T> {
  const [rows] = await pool.execute<T>(sql, params);
  return rows;
}

export async function execute(
  sql: string,
  params: QueryParam[] = []
): Promise<ResultSetHeader> {
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
}

export function calcTankPercent(dist: number, emptyThreshold: number): number {
  if (dist >= emptyThreshold) return 0;
  return Math.round(Math.max(0, Math.min(100, ((emptyThreshold - dist) / emptyThreshold) * 100)) * 100) / 100;
}
