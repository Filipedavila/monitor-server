import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../auth.service";
import { AuthenticatedUser } from "../interfaces/types";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(
    username: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    const user = await this.authService.verifyUserCredentials(
      username,
      password,
    );
    if (!user || !user.id || !user.username || !user.role) {
      throw new UnauthorizedException();
    }
    return {
      id: user.id,
      username: user.username,
      role_slug: user.role?.slug,
      orgs: user.organizations?.map(org => org.id.toString()) || [],
    };
  }
}
