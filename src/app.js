import "dotenv/config";
import express from "express";
import cors from "cors";
import { resolve } from "path";
import Youch from "youch";
import * as Sentry from "@sentry/node";
import sentryConfig from "./config/sentry";
import routes from "./routes";

import "express-async-errors";

import "./database";

class App {
  constructor() {
    this.server = express();

    Sentry.init(sentryConfig);

    this.middlewares();
    this.routes();
    this.exceptionHandler();
  }

  middlewares() {
    this.server.use(Sentry.Handlers.requestHandler());
    this.server.use(cors());
    this.server.use(express.json());
    this.server.use(
      "/files",
      express.static(resolve(__dirname, "..", "tmp", "uploads"))
    );
  }

  routes() {
    this.server.use(routes);
    this.server.use(
      Sentry.Handlers.errorHandler({
        shouldHandleError(error) {
          // Capture all 404 and 500 errors
          if (
            error.status === 400 ||
            error.status === 401 ||
            error.status === 500
          ) {
            return true;
          }
          return false;
        }
      })
    );
  }
  exceptionHandler() {
    this.server.use(async (err, req, res, next) => {
      if (process.env.NODE_ENV === "development") {
        const errors = await new Youch(err, req).toJSON();
        return res.status(500).json(errors);
      }
      return res.status(500).json({ error: "Internal server error" });
    });
  }
}

export default new App().server;
