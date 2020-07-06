import * as LendingManager from './lib/lending-manager';
import loggerFactory from './lib/logger';
import dispatch from './lib/dispatcher';

const logger = loggerFactory.getLogger('api');
const makeResponse = (statusCode, result) => {
  let body = '';
  if (result) {
    body = JSON.stringify(result);
  }
  const response = {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body,
  };

  return response;
};

export const postLending = async (event) => {
  const lending = JSON.parse(event.body);
  const { sub } = event.requestContext.authorizer.claims;
  let result = '';
  let statusCode;

  try {
    result = await LendingManager.lendBook(sub, lending);
    statusCode = 201;
  } catch (error) {
    statusCode = 400;
    const { message } = error;
    result = { message };
  }
  return makeResponse(statusCode, result);
};

/**
 * Handle messages from SQS
 * @param {*} event
 */
export const handleMessages = async (event) => {
  const { Records } = event;

  // FIXME: At the current stage, by design, only process 1 event at a time
  const record = Records[0];
  const { messageId, body, messageAttributes } = record;
  let replyAddress = null;

  if (messageAttributes.replyAddress) {
    replyAddress = messageAttributes.replyAddress.stringValue;
  }

  const payload = JSON.parse(body);

  logger.info(`Message received: ${messageId}`);

  const { operation, ...rest } = payload;
  await dispatch(operation, rest, replyAddress);
};
