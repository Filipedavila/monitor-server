import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { jwtConstants } from "./apps-constants";
import { AppsAuthService } from "./apps-auth.service";

@Injectable()
export class AppsJwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly appsAuthService: AppsAuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any): Promise<any> {
    const valid = await this.appsAuthService.verifyUserPayload(payload);

    delete payload.exp;
    const token = this.appsAuthService.signToken(payload);

    const isBlackListed = await this.appsAuthService.isTokenBlackListed(token);
    if (!valid || isBlackListed) {
      throw new UnauthorizedException();
    }

    return { userId: payload.sub, username: payload.username };
  }
}
