import pgpromise, { ParameterizedQuery } from 'pg-promise';

import { LENDING_STATUS } from './utils';

// Initialize pg-promise
const pgp = pgpromise();

/** In Postgres, COUNT is BigInt type, the NodeJS driver converts it to a JS
 *  string type in order to avoid overflow.
 *  As we are never have more than Number.MAX_VALUE of books for a given library,
 *  we assume we can convert to integer safely
 */
pgp.pg.types.setTypeParser(20 /* int8 */, (val) => parseInt(val, 10));

const database = pgp({ capSQL: true });

export const getDatabase = () => database;
export const getDbSchemaName = () => process.env.PGSCHEMA || 'celsus_lendings';

const schemaName = getDbSchemaName();

export const saveLending = async (userId, lending, status) => {
  const { id, bookId, contactId } = lending;
  const query = new ParameterizedQuery({
    text: `INSERT INTO "${schemaName}"."lending" ("id", "user_id", "book_id", "borrower_id", "status") VALUES ($1, $2, $3, $4, $5);`,
    values: [id, userId, bookId, contactId, status],
  });

  await database.none(query);
};

export const readLending = async (userId, lendingId) => {
  const query = new ParameterizedQuery({
    text: `SELECT "id", "borrower_id" as "borrowerId", "book_id" as "bookId", "lent_at" as "lentAt", "returned_at" as "returnedAt", "status" FROM "${schemaName}"."lending" WHERE id=$1 AND user_id=$2`,
    values: [lendingId, userId],
  });

  const row = await database.oneOrNone(query);
  return row;
};

/**
 * Check if a book is already lent in the local database
 * Meaning the returned_at date is not set
 * @param {*} userId
 * @param {*} bookId
 */
export const checkLentBook = async (userId, bookId) => {
  const query = new ParameterizedQuery({
    text: `SELECT "id" FROM "${schemaName}"."lending"
    WHERE user_id=$1 AND book_id=$2 AND returned_at IS NULL`,
    values: [userId, bookId],
  });

  const row = await database.oneOrNone(query);
  return row;
};

export const transitionToBookValidated = async (userId, lendingId, title) => {
  const query = new ParameterizedQuery({
    text: `UPDATE "${schemaName}"."lending" SET "status"='${LENDING_STATUS.BOOK_VALIDATED}', "title"=$1 WHERE id=$2 AND user_id=$3 AND status='${LENDING_STATUS.PENDING}'
    RETURNING borrower_id AS "borrowerId"`,
    values: [title, lendingId, userId],
  });
  const row = await database.oneOrNone(query);
  return row;
};

export const transitionToConfirmed = async (userId, lendingId, nickname) => {
  const query = new ParameterizedQuery({
    text: `UPDATE "${schemaName}"."lending" SET "status"='${LENDING_STATUS.CONFIRMED}', "nickname"=$1 WHERE id=$2 AND user_id=$3 AND status='${LENDING_STATUS.BOOK_VALIDATED}'
    RETURNING book_id AS "bookId"`,
    values: [nickname, lendingId, userId],
  });
  const row = await database.oneOrNone(query);
  return row;
};

export const removeLending = async (userId, lendingId) => {
  const query = new ParameterizedQuery({
    text: `DELETE FROM "${schemaName}"."lending" WHERE id=$1 AND user_id=$2
    RETURNING book_id as "bookId", borrower_id as "borrowerId"`,
    values: [lendingId, userId],
  });

  const row = await database.oneOrNone(query);
  return row;
};
