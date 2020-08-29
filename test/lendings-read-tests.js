import { assert } from 'chai';
import dotenv from 'dotenv';

import { makeMockEvent } from './utils';
import { getLendings } from '../src/handler';

dotenv.config();

describe('Lendings Test (READ-UPDATE)', async () => {
  it('Succeeds with list of lendings', async () => {
    const event = makeMockEvent('user2', { page: 1 });
    const { itemsPerPage, total, lendings } = await getLendings(event);
    assert.isNotNull(itemsPerPage);
    assert.strictEqual(total, 2);
    assert.strictEqual(lendings.length, 2);
    const [lending1, lending2] = lendings;

    assert.strictEqual(lending1.id, '9');
    assert.strictEqual(lending1.bookId, 'book8');
    assert.strictEqual(lending1.title, 'title8');
    assert.strictEqual(lending1.contactId, 'contact1');
    assert.strictEqual(lending1.nickname, 'nickname1');
    assert.strictEqual(lending1.status, 'CONFIRMED');
    assert.isNotNull(lending1.lentAt);

    assert.strictEqual(lending2.id, '10');
    assert.strictEqual(lending2.bookId, 'book9');
    assert.strictEqual(lending2.title, 'title9');
    assert.strictEqual(lending2.contactId, 'contact2');
    assert.strictEqual(lending2.nickname, 'nickname2');
    assert.strictEqual(lending2.status, 'PENDING');
    assert.isNotNull(lending2.lentAt);
  });
});
