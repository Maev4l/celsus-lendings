import { assert } from 'chai';
import dotenv from 'dotenv';
import sinon from 'sinon';

import { newMockEvent } from './utils';
import { postLending } from '../src/handler';
import { getDatabase } from '../src/lib/storage';
import messaging from '../src/lib/messaging';

dotenv.config();
const schemaName = process.env.PGSCHEMA;
const database = getDatabase();

describe('Lendings Test (CREATE-UPDATE)', async () => {
  let sinonSandbox;
  beforeEach(async () => {
    sinonSandbox = sinon.createSandbox();
  });
  afterEach(async () => sinonSandbox.restore());

  it('Starts a lend book transaction for user1', async () => {
    const expectedUserId = 'user1';
    const expectedLend = { bookId: '1', contactId: '1' };
    const { bookId: expectedBookId, contactId: expectedBorrowerId } = expectedLend;

    const stubValidateBook = sinonSandbox.stub(messaging, 'validateBook');
    const stubValidateBorrower = sinonSandbox.stub(messaging, 'validateBorrower');
    const event = newMockEvent(expectedUserId, expectedLend);
    const response = await postLending(event);

    const { statusCode, body } = response;
    assert.strictEqual(statusCode, 201);

    const { id } = JSON.parse(body);
    assert.exists(id);
    assert.notEqual(id, '');

    sinon.assert.calledWith(stubValidateBook, id, expectedUserId, expectedBookId);
    sinon.assert.calledOnce(stubValidateBook);

    sinon.assert.calledWith(stubValidateBorrower, id, expectedUserId, expectedBorrowerId);
    sinon.assert.calledOnce(stubValidateBorrower);

    const rows = await database.any(
      `SELECT "id", "user_id" as "userId", "book_id" as "bookId", "borrower_id" as "borrowerId", "lent_at" as "lentAt", "returned_at" as "returnedAt" FROM "${schemaName}"."lending" WHERE "id"=$1;`,
      [id],
    );

    assert.strictEqual(rows.length, 1);
    const lend = rows[0];

    const { userId, bookId, borrowerId, /* lentAt, */ returnedAt } = lend;
    assert.strictEqual(userId, expectedUserId);
    assert.strictEqual(bookId, expectedBookId);
    assert.strictEqual(borrowerId, expectedBorrowerId);
    assert.isNull(returnedAt);

    await database.none(`DELETE FROM "${schemaName}"."lending" WHERE "id"=$1`, [id]);
  });
});
