const { Sequelize } = require('sequelize');
const path = require('path');

const dbUrl = process.env.DATABASE_URL;

let sequelize;

if (dbUrl && dbUrl.startsWith('postgres')) {
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    },
  });
} else {
  const dbPath = path.join(__dirname, '..', '..', 'krishirakshak.db');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
  });
}

module.exports = { sequelize };
