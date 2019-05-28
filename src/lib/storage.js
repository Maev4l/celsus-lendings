import pgpromise, { ParameterizedQuery } from 'pg-promise';

// Initialize pg-promise
const pgp = pgpromise();

/** In Postgres, COUNT is BigInt type, the NodeJS driver converts it to a JS
 *  string type in order to avoid overflow.
 *  As we are never have more than Number.MAX_VALUE of books for a given library,
 *  we assume we can convert to integer safely
 */
pgp.pg.types.setTypeParser(20 /* int8 */, val => parseInt(val, 10));

const database = pgp({ capSQL: true });

export const getDatabase = () => database;
export const getDbSchemaName = () => process.env.PGSCHEMA || 'celsus_lendings';

const schemaName = getDbSchemaName();

export const saveLending = async (userId, lending, status) => {
  const { id, bookId, contactId } = lending;
  const query = new ParameterizedQuery(
    `INSERT INTO "${schemaName}"."lending" ("id", "user_id", "book_id", "borrower_id", "status") VALUES ($1, $2, $3, $4, $5);`,
    [id, userId, bookId, contactId, status],
  );

  await database.none(query);
};
