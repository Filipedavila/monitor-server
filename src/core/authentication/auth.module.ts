import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { User } from "../../domains/identity/user/user.entity";
import { InvalidToken } from "./entitities/invalid-token.entity";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { jwtConstants } from "./constants/constants";
import { WsJwtAdminGuard } from "./strategies/ws-jwt-admin.strategy";
import { WebSocketsAuth } from "./gateways/auth.gateway";
import { AppLoggerModule } from "../app-logger/app-logger.module";
import { PassportModule } from "@nestjs/passport";

@Module({
  imports: [
    AppLoggerModule,
    TypeOrmModule.forFeature([User, InvalidToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: "1d" },
    }),
  ],
  exports: [AuthService],
  providers: [
    AuthService,
    JwtStrategy,
    WsJwtAdminGuard,
    WebSocketsAuth,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
