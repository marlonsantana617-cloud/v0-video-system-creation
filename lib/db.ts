import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'videodb',
  user: process.env.DB_USER || 'videoapp',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
})

export default pool

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  // Convert PostgreSQL $1, $2 placeholders to MySQL ? placeholders
  const mysqlQuery = text.replace(/\$(\d+)/g, '?')
  
  const [rows] = await pool.execute(mysqlQuery, params)
  return rows as T[]
}

export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] || null
}
