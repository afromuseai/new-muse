console.log("🔥 INDEX FILE IS RUNNING");

import app from "./app";
import { logger } from "./lib/logger";
import { seedAccounts } from "./lib/seed";

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(process.env.PORT) || 8080;

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  seedAccounts().catch((err) => {
    logger.error({ err }, "Seed failed");
  });
});