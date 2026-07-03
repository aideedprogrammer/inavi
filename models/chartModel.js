const { getConnection } = require('./userModel');

async function dropAndCreateTable() {
  const conn = await getConnection();
  await conn.query(`DROP TABLE IF EXISTS chart`);
  await conn.query(`
    CREATE TABLE chart (
      id INT AUTO_INCREMENT PRIMARY KEY,
      infoChart JSON NOT NULL,
      createdBy VARCHAR(100),
      updatedBy VARCHAR(100),
      ownerBy VARCHAR(100),
      dateInsert DATETIME DEFAULT CURRENT_TIMESTAMP,
      dateUpdate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ chart table created');
  await conn.end();
}

async function getAllCharts() {
  const conn = await getConnection();
  const [rows] = await conn.query(`SELECT * FROM chart`);
  await conn.end();
  return rows;
}

async function insertChart({ infoChart, createdBy, updatedBy, ownerBy }) {
  const conn = await getConnection();
  const [result] = await conn.query(
    `INSERT INTO chart (infoChart, createdBy, updatedBy, ownerBy)
     VALUES (?, ?, ?, ?)`,
    [JSON.stringify(infoChart), createdBy, updatedBy, ownerBy]
  );
  await conn.end();
  return result.insertId;
}

async function getChartById(id) {
  const conn = await getConnection();
  const [rows] = await conn.query(`SELECT * FROM chart WHERE id = ?`, [id]);
  await conn.end();
  return rows[0];
}

async function updateChart(id, { infoChart, updatedBy, ownerBy }) {
  const conn = await getConnection();
  await conn.query(
    `UPDATE chart
     SET infoChart = ?, updatedBy = ?, ownerBy = ?
     WHERE id = ?`,
    [JSON.stringify(infoChart), updatedBy, ownerBy, id]
  );
  await conn.end();
}

async function deleteChart(id) {
  const conn = await getConnection();
  await conn.query(`DELETE FROM chart WHERE id = ?`, [id]);
  await conn.end();
}

async function getChartByOwner(ownerBy) {
  const conn = await getConnection();
  const [rows] = await conn.query(`SELECT * FROM chart WHERE ownerBy = ? LIMIT 1`, [ownerBy]);
  await conn.end();
  return rows[0]; // return the chart object or undefined
}

module.exports = {
  dropAndCreateTable,
  getAllCharts,
  insertChart,
  getChartById,
  updateChart,
  deleteChart,
  getChartByOwner
};
