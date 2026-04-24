import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { HttpExceptionFilter } from "./common/http-exception.filter";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { AppLoggerService } from "./core/app-logger/app-logger.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, "data:", "validator.swagger.io"],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
        },
      },
    }),
  );
  app.useWebSocketAdapter(new IoAdapter(app) as any);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(compression());
  const logger = await app.resolve(AppLoggerService);
  app.useLogger(logger);

  const config = new DocumentBuilder()
    .setTitle("Monitor server")
    .setDescription("The Monitor Server API description")
    .setVersion("1.0")
    .addTag("website")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });
  SwaggerModule.setup("api", app, document);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(` Server is running on: http://localhost:${port}/v1`);
  console.log(` Swagger documentation: http://localhost:${port}/api`);
}
bootstrap();
