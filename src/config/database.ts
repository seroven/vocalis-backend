import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  waitForConnections: true,
  connectionLimit: 10,
});

export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  message: string;
}> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    return {
      connected: true,
      message: `Conectado a MySQL (${env.db.name})`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error desconocido de MySQL';

    return {
      connected: false,
      message,
    };
  }
}
