import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';

dotenv.config();

// Verificar que DATABASE_URL existe
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no está definida en las variables de entorno');
}

// Crear conexión a PostgreSQL
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);

// Crear instancia de Drizzle con el schema
export const db = drizzle(client, { schema });

// Cerrar conexión (útil para scripts)
export const closeConnection = async () => {
  await client.end();
};
