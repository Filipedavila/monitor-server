import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthService } from "../auth.service";
import { UserService } from "src/domains/identity/user/user.service";

@Injectable()
export class AutenticacaoGovGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.query.access_token;
    const govUser = await this.authService.verifyLoginUser(token);
    if (!govUser) {
      return false;
    }
    const user = await this.authService.findUserByGovId(govUser.id);

    if (user) {
      request.user = user;
    }

    return !!user;
  }
  }
