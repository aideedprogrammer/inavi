const mysql = require('mysql2/promise');

// Change this to your own MySQL credentials
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'P@ssw0rd123',
  database: 'inavigator'
};

async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

async function dropAndCreateTable() {
  const conn = await getConnection();
  await conn.query(`DROP TABLE IF EXISTS users`);
  await conn.query(`
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100),
      role ENUM('Admin', 'User') NOT NULL DEFAULT 'User',
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    )
  `);
  console.log('✅ users table created');
  await conn.end();
}

async function getAllUsers() {
  const conn = await getConnection();
  const [rows] = await conn.query(`SELECT id, name, role, username FROM users`);
  await conn.end();
  return rows;
}

async function insertUser({ name, role, username, password }) {
  const conn = await getConnection();
  const [rows] = await conn.query(
    `INSERT INTO users (name, role, username, password) VALUES (?, ?, ?, ?)`,
    [name, role, username, password]
  );
  await conn.end();
  return rows.insertId;
}

async function validateLogin(username, password) {
  const conn = await getConnection();
  const [rows] = await conn.query(
    `SELECT * FROM users WHERE username = ? AND password = ? LIMIT 1`,
    [username, password]
  );
  await conn.end();
  return rows[0]; // Return user object or undefined
}


async function addUser({ name, role, username, password }) {
  const conn = await getConnection();
  const [result] = await conn.query(
    `INSERT INTO users (name, role, username, password)
     VALUES (?, ?, ?, ?)`,
    [name, role, username, password]
  );
  await conn.end();
  return result.insertId;
}

async function updateUser(id, { name, role, username, password }) {
  const conn = await getConnection();
  await conn.query(
    `UPDATE users
     SET name = ?, role = ?, username = ?, password = ?
     WHERE id = ?`,
    [name, role, username, password, id]
  );
  await conn.end();
}

async function deleteUser(id) {
  const conn = await getConnection();
  await conn.query(`DELETE FROM users WHERE id = ?`, [id]);
  await conn.end();
}

async function resetPassword(id, newPassword) {
  const conn = await getConnection();
  await conn.query(`UPDATE users SET password = ? WHERE id = ?`, [newPassword, id]);
  await conn.end();
}


async function updateUserWithoutPassword(id, { name, role, username }) {
  const conn = await getConnection();
  await conn.query(
    `UPDATE users SET name = ?, role = ?, username = ? WHERE id = ?`,
    [name, role, username, id]
  );
  await conn.end();
}


module.exports = {
  dropAndCreateTable,
  insertUser,
  validateLogin,
  getAllUsers,
  addUser,
  updateUser,
  deleteUser,
  resetPassword,
  updateUserWithoutPassword,
  getConnection 
};
