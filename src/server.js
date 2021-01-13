'use strict';
const knex = require('knex');
const app = require('./app');
const pg = require('pg');

pg.defaults.ssl = process.env.NODE_ENV === 'production';

const { PORT, DATABASE_URL } = require('./config');
const db = knex({
  client: 'pg',
  connection: DATABASE_URL,
});
app.set('db', db);

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});