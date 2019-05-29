/**
 * Dispatch message to the according function
 */
import CelsusException from './exception';
import { INCOMING_OPERATIONS } from './utils';
import * as LendingManager from './lending-manager';

const registry = new Map();

registry.set(INCOMING_OPERATIONS.VALIDATE_LEND_BOOK, async payload => {
  await LendingManager.handleLendBookValidationResult(payload);
});

registry.set(INCOMING_OPERATIONS.VALIDATE_BOOK_BORROWER, async payload => {
  await LendingManager.handleBookBorrowerValidationResult(payload);
});

export default async (operation, payload, replyAddress) => {
  const func = registry.get(operation);
  if (!func) {
    throw new CelsusException(`Invalid operation: ${operation}`);
  }

  await func(payload, replyAddress);
};
