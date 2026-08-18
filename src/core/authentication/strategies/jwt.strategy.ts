import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { jwtConstants } from "../constants/constants";
import { AuthService, JWTTokenPayload } from "../auth.service";
import { AuthenticatedUser, RoleSlug, RoleSlugMap } from "../interfaces/types";
import { Request } from "express";
import { ContextEnum, ContextMap, ContextMapByRole } from "src/domains/inventory/context/context.enum";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JWTTokenPayload): Promise<AuthenticatedUser> {

    const valid = await this.authService.verifyUserPayload(payload);

    const rawToken = req.headers['authorization']?.split(' ')[1];
    if (!rawToken) {
      throw new UnauthorizedException('No token provided');
    }
    const isBlackListed = await this.authService.isTokenBlackListed(rawToken);
    if (!valid || isBlackListed) {
      throw new UnauthorizedException();
    }
    const role_slug: RoleSlug = RoleSlugMap[payload.role];
    if (!role_slug) {
      throw new UnauthorizedException(`Invalid role slug: ${payload.role}`);
    }
    const context: ContextEnum = ContextMapByRole[role_slug];
    if(!context) {
      throw new UnauthorizedException(`Role is not associated to Context: ${payload.role}` );
    }
    const contextId:number = ContextMap[context];
    if(!contextId) throw new NotFoundException(`Context Id not found for Context: ${context}` );

      
    return {
      id: payload.sub,
      username: payload.username,
      role_slug: role_slug,
      context: {
        id:contextId,
        code:context
      }
    };
  }
}
