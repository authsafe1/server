import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import RedisStore from "connect-redis";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import timezone from "dayjs/plugin/timezone";
import session from "express-session";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { redis } from "./common/config/redis.config";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const redisStore = new RedisStore({
    client: redis,
  });
  dayjs.extend(advancedFormat);
  dayjs.extend(timezone);
  app.set("trust proxy", "loopback");
  app.use(helmet());
  app.use(
    session({
      name: "__session",
      secret: process.env.SESSION_SECRET,
      store: redisStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        priority: "high",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        signed: true,
      },
    }),
  );
  app.enableCors({
    origin: (origin, callback) => {
      callback(null, origin);
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableShutdownHooks();
  await app.listen(3000);
}
bootstrap();
