import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];
const port = Number(rawPort || "8080");

if (Number.isNaN(port) || port <= 0) {
  logger.warn({ rawPort }, "Invalid PORT value, defaulting to 8080");
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
