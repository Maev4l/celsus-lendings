import CelsusException from './exception';

import { saveLending } from './storage';

export const lendBook = async (userId, lending) => {
  // TODO: const { error } = Joi.validate(lending, schema);
  if (error) {
    const { message } = error.details[0];
    throw new CelsusException(message);
  }

  const id = uuidv4();
  await saveLending(userId, { ...lending, id });

  return {
    id,
  };
};
