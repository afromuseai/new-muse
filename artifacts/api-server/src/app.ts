import express, { type Express, type Request, type Response, type NextFunction } from "express";
import authRoutes from "./routes/auth";
import musicRoutes from "./routes/music";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());

// Stripe webhook needs raw body for signature verification — must come before json parser
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

// Paystack webhook: capture raw body for HMAC-SHA512 signature verification
app.use("/api/paystack/webhook", (req: Request, _res: Response, next: NextFunction) => {
  let rawData = Buffer.alloc(0);
  req.on("data", (chunk: Buffer) => { rawData = Buffer.concat([rawData, chunk]); });
  req.on("end", () => {
    (req as Request & { rawBody: Buffer }).rawBody = rawData;
    try { req.body = JSON.parse(rawData.toString()); } catch { req.body = {}; }
    next();
  });
});

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/music", musicRoutes);

app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
