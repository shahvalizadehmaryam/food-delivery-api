import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import swaggerDefinition from '../../docs/swaggerDef.js';

const router = express.Router();

const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: [
    path.join(process.cwd(), 'src/docs/auth.yml'),
    path.join(process.cwd(), 'src/docs/user.yml'),
    path.join(process.cwd(), 'src/docs/menu.yml'),
    path.join(process.cwd(), 'src/docs/basket.yml'),
    path.join(process.cwd(), 'src/docs/flashDeal.yml'),
    path.join(process.cwd(), 'src/docs/order.yml'),
    path.join(process.cwd(), 'src/docs/components.yml'),
  ],
});

router.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec));

export default router;
