import { Server } from "http";
import app from "./app";
import prisma from "./client";
import config from "./config/config";
import logger from "./config/logger";

let server: Server | undefined;

const startLocalServer = async () => {
  await prisma.$connect();
  logger.info("Connected to SQL Database");
  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
};

// On Vercel, export the Express app — do not call listen().
// Locally, connect DB and listen as usual.
if (!process.env.VERCEL) {
  startLocalServer().catch((error) => {
    logger.error(error);
    process.exit(1);
  });
} else {
  prisma.$connect()
    .then(() => logger.info("Connected to SQL Database"))
    .catch((error) => logger.error(error));
}

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info("Server closed");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: unknown) => {
  logger.error(error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  if (server) {
    server.close();
  }
});

export default app;
