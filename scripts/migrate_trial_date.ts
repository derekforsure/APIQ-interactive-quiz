import 'dotenv/config';
import { getConnection } from '../utils/db';

async function migrate() {
  let connection;
  try {
    connection = await getConnection();
    console.log('Connected to database...');

    // Check if column exists
    const [columns] = await connection.execute(
      `SHOW COLUMNS FROM admins LIKE 'trial_started_at'`
    );

    if ((columns as any[]).length === 0) {
      console.log('Adding trial_started_at column to admins table...');
      await connection.execute(`
        ALTER TABLE admins
        ADD COLUMN trial_started_at DATETIME AFTER verification_token
      `);
      console.log('Migration successful!');
    } else {
      console.log('Column already exists. Skipping migration.');
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
