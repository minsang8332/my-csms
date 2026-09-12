import serverlessExpress from "@codegenie/serverless-express";
import type { Handler } from "aws-lambda";
import { createApplication } from "./bootstrap";

let cachedHandler: Handler | undefined;

/**
 * API Gateway HTTP API entrypoint. The Nest app is bootstrapped once per warm
 * Lambda execution environment and re-used by subsequent invocations.
 */
export const handler: Handler = async (event, context, callback) => {
  if (!cachedHandler) {
    const app = await createApplication();
    await app.init();
    cachedHandler = serverlessExpress({
      app: app.getHttpAdapter().getInstance(),
    });
  }

  return cachedHandler(event, context, callback);
};
