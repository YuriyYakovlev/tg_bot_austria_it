const mysql = require('mysql2/promise');
const config = require('../../config/config');

const pool = mysql.createPool({
    host: config.dbConfig.HOST,
    user: config.dbConfig.USER,
    password: config.dbConfig.PASSWORD,
    database: config.dbConfig.DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 60000,
    queueLimit: 0
});

pool.on('error', (err) => {
    console.error('Database pool error:', err);
});

async function query(sql, params) {
    return await pool.query(sql, params);
}

module.exports = {
    query
};
