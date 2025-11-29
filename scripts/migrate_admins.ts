import 'dotenv/config';
import { getConnection } from '../utils/db';

async function migrate() {
  let connection;
  try {
    connection = await getConnection();
    console.log('Connected to database...');

    // Check if columns exist
    const [columns] = await connection.execute(
      `SHOW COLUMNS FROM admins LIKE 'stripe_customer_id'`
    );

    if ((columns as any[]).length === 0) {
      console.log('Adding Stripe columns to admins table...');
      await connection.execute(`
        ALTER TABLE admins
        ADD COLUMN stripe_customer_id VARCHAR(255),
        ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'inactive',
        ADD COLUMN subscription_plan VARCHAR(50) DEFAULT 'free'
      `);
      console.log('Migration successful!');
    } else {
      console.log('Stripe columns already exist. Skipping migration.');
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
