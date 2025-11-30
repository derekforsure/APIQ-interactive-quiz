import 'dotenv/config';
import { getConnection } from '../utils/db';

async function migrate() {
  let connection;
  try {
    connection = await getConnection();
    console.log('Connected to database...');

    // Check if created_by column exists in departments
    const [deptColumn] = await connection.execute(
      `SHOW COLUMNS FROM departments LIKE 'created_by'`
    );

    if ((deptColumn as any[]).length === 0) {
      console.log('Adding created_by column to departments table...');
      await connection.execute(`
        ALTER TABLE departments
        ADD COLUMN created_by INT
      `);
      
      // Set existing departments to first admin
      console.log('Setting existing departments to first admin...');
      await connection.execute(`
        UPDATE departments SET created_by = (SELECT id FROM admins ORDER BY id LIMIT 1)
      `);
      
      console.log('Departments created_by column added successfully!');
    } else {
      console.log('Departments created_by column already exists. Skipping...');
    }

    // Check if created_by column exists in students
    const [studentColumn] = await connection.execute(
      `SHOW COLUMNS FROM students LIKE 'created_by'`
    );

    if ((studentColumn as any[]).length === 0) {
      console.log('Adding created_by column to students table...');
      await connection.execute(`
        ALTER TABLE students
        ADD COLUMN created_by INT
      `);
      
      // Set existing students to first admin
      console.log('Setting existing students to first admin...');
      await connection.execute(`
        UPDATE students SET created_by = (SELECT id FROM admins ORDER BY id LIMIT 1)
      `);
      
      console.log('Students created_by column added successfully!');
    } else {
      console.log('Students created_by column already exists. Skipping...');
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
