import sqs from './sqs';
import { logger } from './logger';
import { OUTGOING_OPERATIONS } from './utils';

const CORE_QUEUE = process.env.CORE_QUEUE_URL;
const CONTACTS_QUEUE = process.env.CONTACTS_QUEUE_URL;

/*
const sendMessage = async (message, destination) => {
  const request = sqs.sendMessage({
    QueueUrl: destination,
    MessageBody: JSON.stringify(message),
  });

  try {
    const { MessageId } = await request.promise();
    logger.info(`Message sent: ${MessageId}`);
    return MessageId;
  } catch (error) {
    logger.error(`Fail to send message: ${error.message}`);
    throw error;
  }
};
*/

const messaging = {
  validateBook: async (lendingId, userId, bookId) => {
    logger.info(`Request book validation - lending: ${lendingId}`);
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
  validateBorrower: async (lendingId, userId, contactId) => {
    logger.info(`Request borrower validation - lending: ${lendingId}`);
    await sqs.sendMessageWithReply(
      {
        operation: OUTGOING_OPERATIONS.VALIDATE_BOOK_BORROWER,
        lendingId,
        userId,
        contactId,
      },
      CONTACTS_QUEUE,
    );
  },
  cancelLending: async () => {},
};

export default messaging;
