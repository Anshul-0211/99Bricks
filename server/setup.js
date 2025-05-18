const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const config = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD || '263153',
    port: process.env.DB_PORT || 5432,
};

async function setupDatabase() {
    // First, connect to PostgreSQL without specifying a database
    const client = new Client({
        ...config,
        database: 'postgres', // Connect to default postgres database first
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL');

        // Check if database exists
        const dbName = process.env.DB_NAME || 'bricks';
        const checkDb = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [dbName]
        );

        // Create database if it doesn't exist
        if (checkDb.rows.length === 0) {
            console.log(`Creating database: ${dbName}`);
            await client.query(`CREATE DATABASE ${dbName}`);
            console.log('Database created successfully');
        }

        // Close the initial connection
        await client.end();

        // Connect to the newly created database
        const dbClient = new Client({
            ...config,
            database: dbName,
        });

        await dbClient.connect();
        console.log(`Connected to database: ${dbName}`);

        // Read and execute the SQL file
        const sqlPath = path.join(__dirname, 'new_db.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Split the SQL content into individual commands and execute them
        const commands = sqlContent
            .split(';')
            .filter(cmd => cmd.trim())
            .map(cmd => cmd.trim());

        for (const command of commands) {
            try {
                await dbClient.query(command);
            } catch (err) {
                console.error('Error executing SQL command:', command);
                throw err;
            }
        }

        console.log('Database setup completed successfully');
        await dbClient.end();

    } catch (err) {
        console.error('Error during database setup:', err);
        process.exit(1);
    }
}

setupDatabase().then(() => {
    console.log('Setup process completed');
    process.exit(0);
}); 