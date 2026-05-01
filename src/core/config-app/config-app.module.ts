import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import Joi from "joi";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV == "production" ? "prod" : "dev"}`,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid("development", "production", "staging", "test")
          .required(),
        APP_AUTH_METHOD: Joi.string().valid("local", "gov").required(),
        SECRET_KEY: Joi.string().required(),

        REDIS_HOST: Joi.string().default("localhost"),
        REDIS_PORT: Joi.number().default(6379),

        BULL_BOARD_ROUTE: Joi.string().default("/admin/queues"),

        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(3306),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),

        MONGO_URI: Joi.string().required(),

        PAGINATION_MAX_LIMIT: Joi.number()
          .integer()
          .min(10)
          .max(100)
          .default(100),
        PAGINATION_DEFAULT_LIMIT: Joi.number()
          .integer()
          .min(10)
          .max(100)
          .default(10),
        IP_BLACKLIST_RANGES: Joi.string().default(""),
        FGA_API_URL: Joi.string().required(),
        FGA_STORE_ID: Joi.string().required(),
        FGA_MODEL_ID: Joi.string().required(),
        FGA_AUTH_MODEL: Joi.string().required(),
      }),
    }),
  ],
  exports: [ConfigModule],
})
export class ConfigAppModule {}
