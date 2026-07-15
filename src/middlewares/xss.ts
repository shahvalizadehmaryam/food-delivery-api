import { NextFunction, Request, Response } from 'express';
import { inHTMLData } from 'xss-filters';

/**
 * Clean for xss.
 * @param {string/object} data - The value to sanitize
 * @return {string/object} The sanitized value
 */
export const clean = <T>(data: T | string = ''): T => {
  let isObject = false;
  if (typeof data === 'object') {
    data = JSON.stringify(data);
    isObject = true;
  }

  data = inHTMLData(data as string).trim();
  if (isObject) data = JSON.parse(data);

  return data as T;
};

const sanitizeInPlace = (obj: Record<string, unknown>): void => {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === 'string') {
      obj[key] = inHTMLData(value).trim();
    } else if (Array.isArray(value)) {
      obj[key] = value.map((item) =>
        typeof item === 'string' ? inHTMLData(item).trim() : item
      );
    } else if (value && typeof value === 'object') {
      sanitizeInPlace(value as Record<string, unknown>);
    }
  }
};

const middleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object') {
      sanitizeInPlace(req.body as Record<string, unknown>);
    }
    if (req.query && typeof req.query === 'object') {
      sanitizeInPlace(req.query as Record<string, unknown>);
    }
    if (req.params && typeof req.params === 'object') {
      sanitizeInPlace(req.params as Record<string, unknown>);
    }
    next();
  };
};

export default middleware;
