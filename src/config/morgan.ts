import { Response } from 'express';
import morgan from 'morgan';
import config from './config';
import logger from './logger';

morgan.token('message', (req, res: Response) => res.locals.errorMessage || '');

const getIpFormat = () => (config.env === 'production' ? ':remote-addr - ' : '');
const successResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms`;
const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;

export const successHandler = morgan(successResponseFormat, {
  skip: (req, res) => res.statusCode >= 400,
  stream: { write: (message) => logger.info(message.trim()) }
});

export const errorHandler = morgan(errorResponseFormat, {
  skip: (req, res) => res.statusCode < 400,
  stream: {
    write: (message) => {
      // Client errors (4xx) are often expected; reserve error level for 5xx
      const isServerError = /\s5\d{2}\s/.test(message);
      if (isServerError) {
        logger.error(message.trim());
      } else {
        logger.warn(message.trim());
      }
    }
  }
});

export default {
  successHandler,
  errorHandler
};
