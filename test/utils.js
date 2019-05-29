export const newMockEvent = (sub, body, pathParameters, queryStringParameters) => {
  const mockEvent = {
    requestContext: {
      authorizer: {
        claims: {
          sub,
        },
      },
    },
    body: JSON.stringify(body),
    pathParameters,
    queryStringParameters,
  };

  return mockEvent;
};

export const newMockMessage = (message, replyAddress) => {
  let record = {
    messageId: '0',
    body: JSON.stringify(message),
    messageAttributes: {},
  };
  if (replyAddress) {
    record = { ...record, messageAttributes: { replyAddress: { stringValue: replyAddress } } };
  }

  const mockMessage = {
    Records: [record],
  };

  return mockMessage;
};
