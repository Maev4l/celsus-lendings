import { createLogger, transports } from 'winston';

/** Log configuration */
// eslint-disable-next-line import/prefer-default-export
export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new transports.Console({
      timestamp: true,
    }),
  ],
});
