const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'bricks',
    password: process.env.DB_PASSWORD || '263153',
    port: process.env.DB_PORT || 5432,
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        console.error('Please make sure PostgreSQL is running and the database exists');
        console.error('You may need to run the setup script first: node setup.js');
    } else {
        console.log('Database connected successfully at:', res.rows[0].now);
    }
});

module.exports = pool;