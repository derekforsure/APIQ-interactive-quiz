import 'dotenv/config';
import { getConnection } from '../utils/db';

async function migrate() {
  let connection;
  try {
    connection = await getConnection();
    console.log('Connected to database...');

    // Check if role column exists
    const [roleColumn] = await connection.execute(
      `SHOW COLUMNS FROM admins LIKE 'role'`
    );

    if ((roleColumn as any[]).length === 0) {
      console.log('Adding role column to admins table...');
      await connection.execute(`
        ALTER TABLE admins
        ADD COLUMN role VARCHAR(20) DEFAULT 'organizer' AFTER password
      `);
      
      // Set existing admins to 'admin' role
      console.log('Setting existing admins to admin role...');
      await connection.execute(`
        UPDATE admins SET role = 'admin'
      `);
      
      console.log('Role column added successfully!');
    } else {
      console.log('Role column already exists. Skipping...');
    }

    // Check if created_by column exists in sessions
    const [sessionColumn] = await connection.execute(
      `SHOW COLUMNS FROM sessions LIKE 'created_by'`
    );

    if ((sessionColumn as any[]).length === 0) {
      console.log('Adding created_by column to sessions table...');
      await connection.execute(`
        ALTER TABLE sessions
        ADD COLUMN created_by INT
      `);
      
      // Set existing sessions to first admin
      console.log('Setting existing sessions to first admin...');
      await connection.execute(`
        UPDATE sessions SET created_by = (SELECT id FROM admins ORDER BY id LIMIT 1)
      `);
      
      console.log('Sessions created_by column added successfully!');
    } else {
      console.log('Sessions created_by column already exists. Skipping...');
    }

    // Check if created_by column exists in questions_bank
    const [questionColumn] = await connection.execute(
      `SHOW COLUMNS FROM questions_bank LIKE 'created_by'`
    );

    if ((questionColumn as any[]).length === 0) {
      console.log('Adding created_by column to questions_bank table...');
      await connection.execute(`
        ALTER TABLE questions_bank
        ADD COLUMN created_by INT
      `);
      
      // Set existing questions to first admin
      console.log('Setting existing questions to first admin...');
      await connection.execute(`
        UPDATE questions_bank SET created_by = (SELECT id FROM admins ORDER BY id LIMIT 1)
      `);
      
      console.log('Questions created_by column added successfully!');
    } else {
      console.log('Questions created_by column already exists. Skipping...');
    }

    console.log('\n✅ All migrations completed successfully!');

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
