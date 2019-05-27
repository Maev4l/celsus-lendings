import uuidv4 from 'uuid/v4';

import CelsusException from './exception';

import { saveLending } from './storage';
import { validateBook, validateBorrower } from './messaging';

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
  await validateBook(id, userId, bookId);
  // await validateBorrower(id, userId, contactId);

  return {
    id,
  };
};
