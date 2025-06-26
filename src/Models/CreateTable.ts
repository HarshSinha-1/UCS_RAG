import pool from './db';
import config from '../configs/config';

// src/Model/createTables.ts

console.log(pool);

export async function createTables() {
  try {
 
   await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,

        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_verification (
        email VARCHAR(255) PRIMARY KEY REFERENCES users(email) ON DELETE CASCADE,
        otp VARCHAR(4)
      );
    `);

    console.log('Tables created or already exist');
  } catch (error : any) {
  console.error('Error creating users table:', error.message);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
}

}
