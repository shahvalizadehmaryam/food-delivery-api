import { readFileSync } from 'fs';
import path from 'path';
import config from '../config/config.js';

const packageJson = JSON.parse(
  readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
) as { name: string; version: string };

const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: `${packageJson.name} API documentation`,
    version: packageJson.version,
    description: 'Order Food backend API',
  },
  servers: [
    {
      url: `http://localhost:${config.port}/v1`,
      description: 'Development server',
    },
  ],
};

export default swaggerDef;
