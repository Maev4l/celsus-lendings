import { assert } from 'chai';
import dotenv from 'dotenv';
import sinon from 'sinon';

import { newMockEvent, newMockMessage } from './utils';
import { postLending, handleMessages } from '../src/handler';
import { getDatabase } from '../src/lib/storage';
import sqs from '../src/lib/sqs';
import {
  INCOMING_OPERATIONS,
  OUTGOING_OPERATIONS,
  LEND_BOOK_VALIDATION_STATUS,
  LENDING_STATUS,
} from '../src/lib/utils';

dotenv.config();
const schemaName = process.env.PGSCHEMA;
const database = getDatabase();

const CORE_QUEUE = process.env.CORE_QUEUE_URL;
const CONTACTS_QUEUE = process.env.CONTACTS_QUEUE_URL;

describe('Lendings Test (CREATE-UPDATE)', async () => {
  let sinonSandbox;
  let stubSendMessageWithReply;
  let stubSendMessage;

  beforeEach(async () => {
    sinonSandbox = sinon.createSandbox();
    stubSendMessageWithReply = sinonSandbox.stub(sqs, 'sendMessageWithReply');
    stubSendMessage = sinonSandbox.stub(sqs, 'sendMessage');
  });
  afterEach(async () => sinonSandbox.restore());

  it('Fails when lend book with no borrower', async () => {
    const event = newMockEvent('user1', { bookId: '1' });
    const response = await postLending(event);
    const { statusCode } = response;
    assert.strictEqual(statusCode, 400);
  });

  it('Fails when lend book with empty borrower', async () => {
    const event = newMockEvent('user1', { contactId: '', bookId: '1' });
    const response = await postLending(event);
    const { statusCode } = response;
    assert.strictEqual(statusCode, 400);
  });

  it('Fails when lend book with no book', async () => {
    const event = newMockEvent('user1', { contactId: '1' });
    const response = await postLending(event);
    const { statusCode } = response;
    assert.strictEqual(statusCode, 400);
  });

  it('Fails when lend book with empty borrower', async () => {
    const event = newMockEvent('user1', { contactId: '1', bookId: '' });
    const response = await postLending(event);
    const { statusCode } = response;
    assert.strictEqual(statusCode, 400);
  });

  it('Starts a lend book transaction for user1', async () => {
    const expectedUserId = 'user1';
    const expectedLend = { bookId: '1', contactId: '1' };
    const { bookId: expectedBookId, contactId: expectedBorrowerId } = expectedLend;

    const event = newMockEvent(expectedUserId, expectedLend);
    const response = await postLending(event);

    const { statusCode, body } = response;
    assert.strictEqual(statusCode, 201);

    const { id } = JSON.parse(body);
    assert.exists(id);
    assert.notEqual(id, '');

    sinon.assert.calledWith(
      stubSendMessageWithReply,
      {
        operation: OUTGOING_OPERATIONS.VALIDATE_LEND_BOOK,
        lendingId: id,
        userId: expectedUserId,
        bookId: expectedBookId,
      },
      CORE_QUEUE,
    );
    sinon.assert.calledOnce(stubSendMessageWithReply);

    const rows = await database.any(
      `SELECT "id", "user_id" as "userId", "book_id" as "bookId", "borrower_id" as "borrowerId", "lent_at" as "lentAt", "returned_at" as "returnedAt" FROM "${schemaName}"."lending" WHERE "id"=$1;`,
      [id],
    );

    assert.strictEqual(rows.length, 1);
    const lend = rows[0];

    const { userId, bookId, borrowerId, lentAt, returnedAt } = lend;
    assert.strictEqual(userId, expectedUserId);
    assert.strictEqual(bookId, expectedBookId);
    assert.strictEqual(borrowerId, expectedBorrowerId);
    assert.isNotNull(lentAt);
    const now = new Date();
    assert.strictEqual(lentAt.getFullYear(), now.getFullYear());
    assert.strictEqual(lentAt.getMonth(), now.getMonth());
    assert.strictEqual(lentAt.getDate(), now.getDate());
    assert.isNull(returnedAt);

    await database.none(`DELETE FROM "${schemaName}"."lending" WHERE "id"=$1`, [id]);
  });

  it('Handles a successful book validation', async () => {
    const lendingId = '1';
    const userId = 'user1';
    const bookId = 'book1';
    const contactId = 'contact1';

    const mockMessage = newMockMessage({
      operation: INCOMING_OPERATIONS.VALIDATE_LEND_BOOK,
      lendingId,
      userId,
      bookId,
      status: LEND_BOOK_VALIDATION_STATUS.BOOK_VALIDATED,
    });

    await handleMessages(mockMessage);
    sinon.assert.calledWith(
      stubSendMessageWithReply,
      {
        operation: OUTGOING_OPERATIONS.VALIDATE_BOOK_BORROWER,
        lendingId,
        userId,
        contactId,
      },
      CONTACTS_QUEUE,
    );
    sinon.assert.calledOnce(stubSendMessageWithReply);

    const lending = await database.one(
      `SELECT "id", "status" FROM "${schemaName}"."lending" WHERE "id"=$1;`,
      [lendingId],
    );

    const { status } = lending;
    assert.strictEqual(status, LENDING_STATUS.BOOK_VALIDATED);
  });

  it('Handles a failed book validation', async () => {
    const lendingId = '2';
    const userId = 'user1';
    const bookId = 'book2';

    const mockMessage = newMockMessage({
      operation: INCOMING_OPERATIONS.VALIDATE_LEND_BOOK,
      lendingId,
      userId,
      bookId,
      status: LEND_BOOK_VALIDATION_STATUS.BOOK_NOT_VALIDATED,
    });

    await handleMessages(mockMessage);

    // Lending has been removed
    const lending = await database.oneOrNone(
      `SELECT "id", "status" FROM "${schemaName}"."lending" WHERE "id"=$1;`,
      [lendingId],
    );
    assert.isNull(lending);

    // No need to call back core services, to cancel the book lending
    // as core services did not updated the lending status of the book
    sinon.assert.notCalled(stubSendMessage);
  });

  it('Handles a successful borrower validation', async () => {
    const lendingId = '3';
    const userId = 'user1';
    const bookId = 'book3';

    const mockMessage = newMockMessage({
      operation: INCOMING_OPERATIONS.VALIDATE_BOOK_BORROWER,
      lendingId,
      userId,
      bookId,
      status: LEND_BOOK_VALIDATION_STATUS.BORROWER_VALIDATED,
    });

    await handleMessages(mockMessage);
    sinon.assert.calledWith(
      stubSendMessage,
      {
        operation: OUTGOING_OPERATIONS.CONFIRM_LEND_BOOK,
        lendingId,
        userId,
        bookId,
      },
      CORE_QUEUE,
    );
    sinon.assert.calledOnce(stubSendMessage);

    const lending = await database.one(
      `SELECT "id", "status" FROM "${schemaName}"."lending" WHERE "id"=$1;`,
      [lendingId],
    );

    const { status } = lending;
    assert.strictEqual(status, LENDING_STATUS.CONFIRMED);
  });

  it('Handles a failed borrower validation', async () => {
    const lendingId = '4';
    const userId = 'user1';
    const bookId = 'book4';

    const mockMessage = newMockMessage({
      operation: INCOMING_OPERATIONS.VALIDATE_BOOK_BORROWER,
      lendingId,
      userId,
      bookId,
      status: LEND_BOOK_VALIDATION_STATUS.BORROWER_NOT_VALIDATED,
    });

    await handleMessages(mockMessage);
    sinon.assert.calledWith(
      stubSendMessage,
      {
        operation: OUTGOING_OPERATIONS.CANCEL_LEND_BOOK,
        lendingId,
        userId,
        bookId,
      },
      CORE_QUEUE,
    );
    sinon.assert.calledOnce(stubSendMessage);

    const lending = await database.oneOrNone(
      `SELECT "id", "status" FROM "${schemaName}"."lending" WHERE "id"=$1;`,
      [lendingId],
    );

    assert.isNull(lending);
  });

  it('Fails when lending an already lent book', async () => {
    const event = newMockEvent('user1', { bookId: 'book5', contactId: 'contact1' });
    const response = await postLending(event);

    const { statusCode } = response;
    assert.strictEqual(statusCode, 400);
  });

  it('Starts a lend book transaction for a returned book', async () => {
    const event = newMockEvent('user1', { bookId: 'book6', contactId: 'contact1' });
    const response = await postLending(event);

    const { statusCode, body } = response;
    assert.strictEqual(statusCode, 201);

    const { id } = JSON.parse(body);
    assert.exists(id);
    assert.notEqual(id, '');

    const rows = await database.any(
      `SELECT "id", "user_id" as "userId", "book_id" as "bookId", "borrower_id" as "borrowerId", "lent_at" as "lentAt", "returned_at" as "returnedAt" FROM "${schemaName}"."lending" WHERE "id"=$1;`,
      [id],
    );

    assert.strictEqual(rows.length, 1);
  });
});
