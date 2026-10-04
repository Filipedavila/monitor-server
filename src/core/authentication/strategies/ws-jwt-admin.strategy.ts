import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { WsException } from "@nestjs/websockets";

@Injectable()
export class WsJwtAdminGuard extends AuthGuard("jwt") {
  constructor() {
    super();
  }

  getRequest(context: ExecutionContext) {
    const ws = context.switchToWs().getClient();
    return ws.handshake;
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw err || new WsException("Acesso Administrativo Negado");
    }
    return user;
  }
}
