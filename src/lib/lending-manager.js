import { v4 as uuidv4 } from 'uuid';

import loggerFactory from './logger';
import CelsusException from './exception';
import { lendingSchema as schema } from './schemas';
import {
  saveLending,
  removeLending,
  checkLentBook,
  readLending,
  listLendings,
  transitionToReturned,
  transitionToBookValidated,
  transitionToConfirmed,
} from './storage';
import messaging from './messaging';

import { LENDING_STATUS, LEND_BOOK_VALIDATION_STATUS } from './utils';

const logger = loggerFactory.getLogger('biz');

export const LENDINGS_PAGE_SIZE = 5;

export const getLendings = async (userId, offset) => {
  const { rows, rowCount } = await listLendings(userId, offset, LENDINGS_PAGE_SIZE);

  return {
    itemsPerPage: LENDINGS_PAGE_SIZE,
    total: parseInt(rowCount, 10),
    lendings: rows.map((row) => {
      const { id, bookId, contactId, status, nickname, title, lentAt } = row;
      return {
        id,
        bookId,
        contactId,
        status,
        nickname,
        title,
        lentAt,
      };
    }),
  };
};

export const lendBook = async (userId, lending) => {
  const { error } = schema.validate(lending);
  if (error) {
    const { message } = error.details[0];
    throw new CelsusException(message);
  }

  const { bookId } = lending;

  const existingLending = await checkLentBook(userId, bookId);
  if (existingLending) {
    logger.error(`Book already lent - id ${bookId}`);
    throw new CelsusException(`Book already lent`);
  }
  const id = uuidv4();
  await saveLending(userId, { ...lending, id }, LENDING_STATUS.PENDING);
  logger.info(`Validating book: ${bookId} - lending: ${id}`);
  await messaging.validateBook(id, userId, bookId);

  return { id };
};

export const getLending = async (userId, lendingId) => {
  const lending = await readLending(userId, lendingId);
  return lending;
};

export const returnLending = async (userId, lendingId) => {
  const transitionResult = await transitionToReturned(userId, lendingId);
  if (transitionResult) {
    const { bookId, borrowerId: contactId } = transitionResult;
    await messaging.returnLending(lendingId, userId, contactId, bookId);
  }

  return transitionResult;
};

export const handleLendBookValidationResult = async (validationResult) => {
  const { lendingId, userId, result } = validationResult;
  const { status, title } = result;
  logger.info(`Book Validation result: ${status} - lending: ${lendingId}`);

  if (status === LEND_BOOK_VALIDATION_STATUS.BOOK_VALIDATED) {
    // If the book has been validated, request a borrower validation
    // and update the lending status accordingly
    const transitionResult = await transitionToBookValidated(userId, lendingId, title);
    if (transitionResult) {
      const { borrowerId, bookId } = transitionResult;
      await messaging.validateBorrower(lendingId, userId, borrowerId, bookId);
    }
  } else {
    // If the book has NOT been validated remove the lending
    await removeLending(userId, lendingId);
  }
};

export const handleBookBorrowerValidationResult = async (validationResult) => {
  const { lendingId, userId, result } = validationResult;
  const { status, nickname } = result;
  logger.info(`Book Validation result: ${status} - lending: ${lendingId}`);
  if (status === LEND_BOOK_VALIDATION_STATUS.BORROWER_VALIDATED) {
    // The borrower has been validated
    // - update the status lending status accordingly
    // - send a message to update the book lending status
    const transitionResult = await transitionToConfirmed(userId, lendingId, nickname);
    if (transitionResult) {
      const { bookId } = transitionResult;
      await messaging.confirmBookLending(lendingId, userId, bookId);
    }
  } else {
    // The borrower has not been validated
    // - remove the lending
    // - send a message to update the book lending status
    const removeResult = await removeLending(userId, lendingId);
    if (removeResult) {
      const { bookId } = removeResult;
      await messaging.cancelBookLending(lendingId, userId, bookId);
    }
  }
};
