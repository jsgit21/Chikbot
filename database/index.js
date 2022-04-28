const { Pool } = require('pg');
require('dotenv').config(); //initialize dotenv

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
});

module.exports = {
    query: (text, params, callback) => {
        const start = Date.now()
        return pool.query(text, params, callback)
    }
}