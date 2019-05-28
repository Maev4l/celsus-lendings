import AWS from 'aws-sdk';

import { logger } from './logger';
import { OUTGOING_OPERATIONS } from './utils';

const CORE_QUEUE = process.env.CORE_QUEUE_URL;
const CONTACTS_QUEUE = process.env.CONTACTS_QUEUE_URL;
const LENDINGS_QUEUE = process.env.LENDINGS_QUEUE_URL;
const REGION = process.env.region;

AWS.config.update({ region: REGION });
const sqs = new AWS.SQS({ sslEnabled: true, apiVersion: 'latest' });

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

const sendMessageWithReply = async (message, destination) => {
  const request = sqs.sendMessage({
    QueueUrl: destination,
    MessageBody: JSON.stringify(message),
    MessageAttributes: {
      replyAddress: {
        DataType: 'String',
        StringValue: LENDINGS_QUEUE,
      },
    },
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

export const validateBook = async (lendingId, userId, bookId) => {
  logger.info(`Request book validation - lending: ${lendingId}`);
  await sendMessageWithReply(
    {
      operation: OUTGOING_OPERATIONS.VALIDATE_LEND_BOOK,
      lendingId,
      userId,
      bookId,
    },
    CORE_QUEUE,
  );
};

export const validateBorrower = async (lendingId, userId, contactId) => {};
