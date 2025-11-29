import 'dotenv/config';
import { getConnection } from '../utils/db';

async function migrate() {
  let connection;
  try {
    connection = await getConnection();
    console.log('Connected to database...');

    // Check if columns exist
    const [columns] = await connection.execute(
      `SHOW COLUMNS FROM admins LIKE 'email'`
    );

    if ((columns as any[]).length === 0) {
      console.log('Adding email and verification columns to admins table...');
      await connection.execute(`
        ALTER TABLE admins
        ADD COLUMN email VARCHAR(255) UNIQUE,
        ADD COLUMN is_verified TINYINT(1) DEFAULT 0,
        ADD COLUMN verification_token VARCHAR(255)
      `);
      console.log('Migration successful!');
    } else {
      console.log('Columns already exist. Skipping migration.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (connection) {
      connection.release();
      process.exit();
    }
  }
}

migrate();
