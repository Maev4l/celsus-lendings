// eslint-disable-next-line import/no-extraneous-dependencies
import AWS from 'aws-sdk';

const CORE_QUEUE = process.env.CORE_QUEUE_URL;
const CONTACTS_QUEUE = process.env.CONTACTS_QUEUE_URL;
const LENDINGS_QUEUE = process.env.LENDINGS_QUEUE_URL;
const REGION = process.env.region;

AWS.config.update({ region: REGION });
const sqs = new AWS.SQS({ sslEnabled: true, apiVersion: 'latest' });

export const validateBook = async (lendingId, userId, bookId) => {
  const request = sqs.sendMessage({
    QueueUrl: CORE_QUEUE,
    MessageBody: JSON.stringify({ operation: 'VALIDATE_BOOK', lendingId, userId, bookId }),
    MessageAttributes: {
      replyAddress: {
        DataType: 'StringValue',
        StringValue: LENDINGS_QUEUE,
      },
    },
  });

  await request.promise();
};

export const validateBorrower = async (lendingId, userId, contactId) => {};
