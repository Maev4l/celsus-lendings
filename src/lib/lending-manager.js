import uuidv4 from 'uuid/v4';
import Joi from 'joi';

import { logger } from './logger';
import CelsusException from './exception';
import { lendingSchema as schema } from './schemas';
import {
  saveLending,
  removeLending,
  checkLentBook,
  transitionToBookValidated,
  transitionToConfirmed,
} from './storage';
import messaging from './messaging';

import { LENDING_STATUS, LEND_BOOK_VALIDATION_STATUS } from './utils';

export const lendBook = async (userId, lending) => {
  const { error } = Joi.validate(lending, schema);
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

export const handleLendBookValidationResult = async validationResult => {
  const { lendingId, userId, status } = validationResult;
  logger.info(`Book Validation result: ${status} - lending: ${lendingId} - status: ${status}`);

  if (status === LEND_BOOK_VALIDATION_STATUS.BOOK_VALIDATED) {
    // If the book has been validated, request a borrower validation
    // and update the lending status accordingly
    const result = await transitionToBookValidated(userId, lendingId);
    if (result) {
      const { borrowerId } = result;
      await messaging.validateBorrower(lendingId, userId, borrowerId);
    }
  } else {
    // If the book has NOT been validated remove the lending
    await removeLending(userId, lendingId);
  }
};

export const handleBookBorrowerValidationResult = async validationResult => {
  const { lendingId, userId, status } = validationResult;
  logger.info(`Book Validation result: ${status} - lending: ${lendingId} - status: ${status}`);
  if (status === LEND_BOOK_VALIDATION_STATUS.BORROWER_VALIDATED) {
    // The borrower has been validated
    // - update the status lending status accordingly
    // - send a message to update the book lending status
    const result = await transitionToConfirmed(userId, lendingId);
    if (result) {
      const { bookId } = result;
      await messaging.confirmBookLending(lendingId, userId, bookId);
    }
  } else {
    // The borrower has not been validated
    // - remove the lending
    // - send a message to update the book lending status
    const result = await removeLending(userId, lendingId);
    if (result) {
      const { bookId } = result;
      await messaging.cancelBookLending(lendingId, userId, bookId);
    }
  }
};
