/**
 * As npm posttest is not triggered when tests fail,
 * it is more robust to rely on Mocha root hooks to provision and
 * clean up the database after tests
 */

import childProcess from 'child_process';

before('Initialize database', () => {
  const cmd = `psql --host ${process.env.PGHOST} --dbname ${process.env.PGDATABASE} --username ${process.env.PGUSER} --port ${process.env.PGPORT} --file scripts/initialize.sql`;
  childProcess.execSync(cmd);
});

after('Clean up database', () => {
  const cmd = `psql --host ${process.env.PGHOST} --dbname ${process.env.PGDATABASE} --username ${process.env.PGUSER} --port ${process.env.PGPORT} --command 'DROP SCHEMA "${process.env.PGSCHEMA}" CASCADE'`;
  childProcess.execSync(cmd);
});
