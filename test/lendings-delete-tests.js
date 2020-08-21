import { assert } from 'chai';
import dotenv from 'dotenv';
import sinon from 'sinon';
import moment from 'moment';

import { newMockEvent } from './utils';
import { deleteLending } from '../src/handler';
import { getDatabase } from '../src/lib/storage';
import sqs from '../src/lib/sqs';

import { OUTGOING_OPERATIONS } from '../src/lib/utils';

dotenv.config();
const schemaName = process.env.PGSCHEMA;
const database = getDatabase();

const CORE_QUEUE = process.env.CORE_QUEUE_URL;
const CONTACTS_QUEUE = process.env.CONTACTS_QUEUE_URL;

describe('Lendings Test (DELETE)', async () => {
  let sinonSandbox;
  let stubSendMessage;

  beforeEach(async () => {
    sinonSandbox = sinon.createSandbox();
    stubSendMessage = sinonSandbox.stub(sqs, 'sendMessage');
  });
  afterEach(async () => sinonSandbox.restore());

  it('Fails with unknown lending', async () => {
    const event = newMockEvent('user1', null, { id: '99999' });
    const response = await deleteLending(event);
    const { statusCode } = response;
    assert.strictEqual(statusCode, 404);
  });

  it('Fails with an already returned book', async () => {
    const event = newMockEvent('user1', null, { id: '7' });
    const response = await deleteLending(event);
    const { statusCode } = response;
    assert.strictEqual(statusCode, 400);
  });

  it('Succeeds with a lent book', async () => {
    const lendingId = 8;
    const event = newMockEvent('user1', null, { id: lendingId });
    const response = await deleteLending(event);
    const { statusCode } = response;
    assert.strictEqual(statusCode, 204);

    const lending = await database.oneOrNone({
      text: `SELECT "id", "user_id" as "userId", "book_id" as "bookId", "borrower_id" as "borrowerId", "lent_at" as "lentAt", "returned_at" as "returnedAt" FROM "${schemaName}"."lending" WHERE "id"=$1;`,
      values: [lendingId],
    });
    assert.isNotNull(lending.returnedAt);
    assert.strictEqual(lending.returnedAt, moment().format('YYYY-MM-DD'));

    sinon.assert.calledWith(
      stubSendMessage,
      {
        operation: OUTGOING_OPERATIONS.RETURN_LENT_BOOK,
        lendingId,
        userId: 'user1',
        bookId: 'book8',
        contactId: 'contact1',
      },
      CORE_QUEUE,
    );

    sinon.assert.calledWith(
      stubSendMessage,
      {
        operation: OUTGOING_OPERATIONS.RETURN_LENT_BOOK,
        lendingId,
        userId: 'user1',
        bookId: 'book8',
        contactId: 'contact1',
      },
      CONTACTS_QUEUE,
    );
  });
});
