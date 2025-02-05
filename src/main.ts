import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { RedisStore } from "connect-redis";
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
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
    allowedHeaders: "Content-Type, Authorization",
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useBodyParser("json", {
    limit: "10mb",
  });
  app.enableShutdownHooks();
  const config = new DocumentBuilder()
    .setTitle("AuthSafe")
    .setDescription("API for managing AuthSafe's features")
    .setVersion("0.0.1")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);
  await app.listen(3000);
}
bootstrap();
