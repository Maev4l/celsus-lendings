import Joi from 'joi';

// eslint-disable-next-line import/prefer-default-export
export const lendingSchema = Joi.object().keys({
  id: process.env.development ? Joi.string() : Joi.string().guid({ version: ['uuidv4'] }),
  bookId: process.env.development
    ? Joi.string().required()
    : Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),

  contactId: process.env.development
    ? Joi.string().required()
    : Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});
