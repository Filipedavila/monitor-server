import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AppsAuthService } from "./apps-auth.service";

@Injectable()
export class AppsLocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly appsAuthService: AppsAuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.appsAuthService.verifyUserCredentials(
      username,
      password
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
