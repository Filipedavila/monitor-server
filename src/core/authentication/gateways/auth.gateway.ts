import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JsonWebTokenError, JwtService } from "@nestjs/jwt";
import { UnauthorizedException } from "@nestjs/common";

@WebSocketGateway({ cors: true })
export class WebSocketsAuth implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        throw new Error("No token provided");
      }

      const payload = await this.jwtService.verifyAsync(token);

      client["user"] = payload;

      client.join(`user:${payload.sub}`);
      console.log(
        `Client connected: ${payload.username}, userId: ${payload.sub}`,
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.log(`Conexão rejeitada: ${errorMessage}`);
      client.disconnect();
    }
  }
}
