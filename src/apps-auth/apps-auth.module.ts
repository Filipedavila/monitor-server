import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { AppsAuthService } from "./apps-auth.service";
import { AppsAuthController } from "./apps-auth.controller";
import { User } from "../user/user.entity";
import { AppsInvalidToken } from "./apps-invalid-token.entity";
import { AppsLocalStrategy } from "./apps-local.strategy";
import { AppsJwtStrategy } from "./apps-jwt.strategy";
import { AppsJwtAdminStrategy } from "./apps-jwt-admin.strategy";
import { jwtConstants } from "./apps-constants";
import { GovUserModule } from "src/gov-user/gov-user.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AppsInvalidToken]),
    GovUserModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: "1d" },
    }),
  ],
  exports: [AppsAuthService],
  providers: [
    AppsAuthService,
    AppsLocalStrategy,
    AppsJwtStrategy,
    AppsJwtAdminStrategy
  ],
  controllers: [AppsAuthController],
})
export class AppsAuthModule {}
