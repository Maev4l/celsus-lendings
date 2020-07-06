import AWS from 'aws-sdk';

import loggerFactory from './logger';

const logger = loggerFactory.getLogger('sqs');

const LENDINGS_QUEUE = process.env.LENDINGS_QUEUE_URL;

const REGION = process.env.region;
AWS.config.update({ region: REGION });
const sqsClient = new AWS.SQS({ sslEnabled: true, apiVersion: 'latest' });

const sqs = {
  sendMessage: async (message, destination) => {
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
  },
  sendMessageWithReply: async (message, destination) => {
    const request = sqsClient.sendMessage({
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
  },
};

export default sqs;
