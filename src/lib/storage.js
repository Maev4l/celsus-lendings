import pgpromise, { ParameterizedQuery } from "pg-promise";

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
export const getDbSchemaName = () => process.env.PGSCHEMA || "celsus_lendings";

export const saveLending = async (userId, lending) => {
  const { id, bookId, lenderId, lentAt } = library;
  const query = new ParameterizedQuery(
    `INSERT INTO "${schemaName}"."library" ("id", "user_id", "name", "description") VALUES ($1, $2, $3, $4);`,
    [id, userId, name.trim(), description.trim()]
  );

  await database.none(query);
};
