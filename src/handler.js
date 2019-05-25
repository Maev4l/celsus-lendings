import * as LendingManager from "./lib/lending-manager";

const makeResponse = (statusCode, result) => {
  let body = "";
  if (result) {
    body = JSON.stringify(result);
  }
  const response = {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true
    },
    body
  };

  return response;
};

export const postLending = async event => {
  const lending = JSON.parse(event.body);
  const { sub } = event.requestContext.authorizer.claims;
  let result = "";
  let statusCode;

  try {
    result = await LendingManager.lendBook(sub, lending);
    statusCode = 201;
  } catch (e) {
    statusCode = 400;
    const { message } = e;
    result = { message };
  }
  return makeResponse(statusCode, result);
};
