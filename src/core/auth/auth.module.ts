import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { User } from "../../domains/identity/user/user.entity";
import { InvalidToken } from "./entitities/invalid-token.entity";
import { LocalStrategy } from "./strategies/local.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { jwtConstants } from "./constants/constants";
import { GovUserModule } from "src/domains/identity/gov-user/gov-user.module";
import { WsJwtAdminGuard } from "./strategies/ws-jwt-admin.strategy";
import { WebSocketsAuth } from "./gateways/auth.gateway";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, InvalidToken]),
    GovUserModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: "1d" },
    }),
  ],
  exports: [AuthService],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    WsJwtAdminGuard,
    WebSocketsAuth,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
