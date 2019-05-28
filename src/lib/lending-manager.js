import uuidv4 from 'uuid/v4';

import { logger } from './logger';
// import CelsusException from './exception';

import { saveLending } from './storage';
import messaging from './messaging';

import { LENDING_STATUS } from './utils';

export const lendBook = async (userId, lending) => {
  /* TODO: const { error } = Joi.validate(lending, schema);
  if (error) {
    const { message } = error.details[0];
    throw new CelsusException(message);
  } */

  const { bookId, contactId } = lending;

  const id = uuidv4();
  await saveLending(userId, { ...lending, id }, LENDING_STATUS.PENDING);
  logger.info(`Validating book: ${bookId} - lending: ${id}`);
  await messaging.validateBook(id, userId, bookId);
  await messaging.validateBorrower(id, userId, contactId);
  return { id };
};

export const handleLendBookValidationResult = async (lendId, status) => {
  logger.info(`Book Validation result: ${status} - lending: ${lendId}`);
};

// export const handleBookBorrowerValidationResult = async (lendId, status) => {};
