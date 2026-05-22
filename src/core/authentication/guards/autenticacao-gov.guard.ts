import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { AuthService } from "../auth.service";


@Injectable()
export class AutenticacaoGovGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.query.access_token;
    const user = await this.authService.verifyLoginUser(token);
    if (!user) {
      return false;
    }

      request.user = user;

    return !!user;
  }
  }
