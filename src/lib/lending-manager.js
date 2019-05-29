import uuidv4 from 'uuid/v4';
import Joi from 'joi';

import { logger } from './logger';
import CelsusException from './exception';
import { lendingSchema as schema } from './schemas';
import { saveLending, readLending, modifyLendingStatus, removeLending } from './storage';
import messaging from './messaging';

import { LENDING_STATUS, LEND_BOOK_VALIDATION_STATUS } from './utils';

export const lendBook = async (userId, lending) => {
  const { error } = Joi.validate(lending, schema);
  if (error) {
    const { message } = error.details[0];
    throw new CelsusException(message);
  }

  const { bookId } = lending;

  const id = uuidv4();
  await saveLending(userId, { ...lending, id }, LENDING_STATUS.PENDING);
  logger.info(`Validating book: ${bookId} - lending: ${id}`);
  await messaging.validateBook(id, userId, bookId);

  return { id };
};

export const handleLendBookValidationResult = async validationResult => {
  const { lendingId, userId, status } = validationResult;
  logger.info(`Book Validation result: ${status} - lending: ${lendingId} - status: ${status}`);

  if (status === LEND_BOOK_VALIDATION_STATUS.BOOK_VALIDATED) {
    // If the book has been validated, request a borrower validation
    // and update the lending status accordingly
    const lending = await readLending(userId, lendingId);
    if (lending) {
      const { borrowerId } = lending;
      await modifyLendingStatus(userId, lendingId, LENDING_STATUS.BOOK_VALIDATED);
      await messaging.validateBorrower(lendingId, userId, borrowerId);
    }
  } else {
    // If the book has NOT been validated remove the lending
    await removeLending(userId, lendingId);
  }
};

export const handleBookBorrowerValidationResult = async validationResult => {
  const { lendingId, userId, bookId, status } = validationResult;
  logger.info(`Book Validation result: ${status} - lending: ${lendingId} - status: ${status}`);
  if (status === LEND_BOOK_VALIDATION_STATUS.BORROWER_VALIDATED) {
    // The borrower has been validated
    // - update the status lending status accordingly
    // - send a message to update the book lending status
    const lending = await readLending(userId, lendingId);
    if (lending) {
      await modifyLendingStatus(userId, lendingId, LENDING_STATUS.CONFIRMED);
      await messaging.confirmBookLending(lendingId, userId, bookId);
    }
  } else {
    // The borrower has not been validated
    // - remove the lending
    // - send a message to update the book lending status
    await removeLending(userId, lendingId);
    await messaging.cancelBookLending(lendingId, userId, bookId);
  }
};
