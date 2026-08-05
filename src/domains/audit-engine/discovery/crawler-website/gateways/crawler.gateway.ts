import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { OnEvent } from "@nestjs/event-emitter";
import { Server } from "socket.io";
import { WsJwtAdminGuard } from "src/core/authentication/strategies/ws-jwt-admin.strategy";
import { UseGuards } from "@nestjs/common";
import { CrawlWebsiteResponseDTO } from "../dto/crawler-website-response.dto";

@WebSocketGateway({ cors: true })
export class WebsitesGateway {
  @WebSocketServer()
  server: Server;

  @OnEvent("crawler.finished")
  handleCrawlerFinishedEvent(userId: number, payload: CrawlWebsiteResponseDTO) {
    this.server.emit("crawler:updated", payload);
    const userRoom = `user:${userId}`;
    this.server.to(userRoom).emit("notification", {
      status: "success",
      message: `O teu crawler para ${payload.url} terminou!`,
      details: payload,
    });
  }

  @OnEvent("crawler.created")
  handleCrawlerCreatedEvent(payload: CrawlWebsiteResponseDTO) {
    console.log(
      "Emitting crawler:created event with payload:",
      JSON.stringify(payload, null, 2),
    );
    this.server.emit("crawler:new", payload);
  }

  @OnEvent("crawler.deleted")
  handleCrawlerDeletedEvent(ids: string[]) {
    const payload = { ids };
    this.server.emit("crawler:deleted", payload);
  }

  @OnEvent("crawler.error")
  handleCrawlerErrorEvent(userId: number, payload: CrawlWebsiteResponseDTO) {
    const userRoom = `user:${userId}`;
    this.server.to(userRoom).emit("notification", {
      status: "error",
      message: `O teu crawler para ${payload.url} encontrou um erro!`,
      details: payload,
    });
  }
}
