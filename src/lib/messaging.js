import sqs from './sqs';
import loggerFactory from './logger';
import { OUTGOING_OPERATIONS } from './utils';

const CORE_QUEUE = process.env.CORE_QUEUE_URL;
const CONTACTS_QUEUE = process.env.CONTACTS_QUEUE_URL;
const logger = loggerFactory.getLogger('messaging');

/*
const sendMessage = ;
*/

const messaging = {
  validateBook: async (lendingId, userId, bookId) => {
    logger.info(`Request book validation - lending: ${lendingId} - book: ${bookId}`);
    await sqs.sendMessageWithReply(
      {
        operation: OUTGOING_OPERATIONS.VALIDATE_LEND_BOOK,
        lendingId,
        userId,
        bookId,
      },
      CORE_QUEUE,
    );
  },
  validateBorrower: async (lendingId, userId, contactId, bookId) => {
    logger.info(`Request borrower validation - lending: ${lendingId} - borrower: ${contactId}`);
    await sqs.sendMessageWithReply(
      {
        operation: OUTGOING_OPERATIONS.VALIDATE_BOOK_BORROWER,
        lendingId,
        userId,
        contactId,
        bookId,
      },
      CONTACTS_QUEUE,
    );
  },
  confirmBookLending: async (lendingId, userId, bookId) => {
    logger.info(`Confirm book lending - lending: ${lendingId} - book: ${bookId}`);
    await sqs.sendMessage(
      {
        operation: OUTGOING_OPERATIONS.CONFIRM_LEND_BOOK,
        lendingId,
        userId,
        bookId,
      },
      CORE_QUEUE,
    );
  },
  cancelBookLending: async (lendingId, userId, bookId) => {
    logger.info(`Cancel book lending - lending: ${lendingId} - book: ${bookId}`);
    await sqs.sendMessage(
      {
        operation: OUTGOING_OPERATIONS.CANCEL_LEND_BOOK,
        lendingId,
        userId,
        bookId,
      },
      CORE_QUEUE,
    );
  },

  returnLending: async (lendingId, userId, contactId, bookId) => {
    logger.info(
      `Return book lending - lending: ${lendingId} - book: ${bookId} - contact: ${contactId}`,
    );
    const message = {
      operation: OUTGOING_OPERATIONS.RETURN_LENT_BOOK,
      lendingId,
      userId,
      contactId,
      bookId,
    };
    await sqs.sendMessage(message, CORE_QUEUE);

    await sqs.sendMessage(message, CONTACTS_QUEUE);
  },
};

export default messaging;
