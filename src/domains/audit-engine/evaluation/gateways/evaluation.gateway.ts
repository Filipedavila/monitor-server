import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { OnEvent } from "@nestjs/event-emitter";
import { Server } from "socket.io";
import { WsJwtAdminGuard } from "src/core/auth/strategies/ws-jwt-admin.strategy";
import { UseGuards } from "@nestjs/common";
import { EvaluationWorkerCommunicationDTO } from "../dto/EvaluationWorkerCommunication.dto";

@WebSocketGateway({ cors: true, namespace: "evaluation" })
@UseGuards(WsJwtAdminGuard)
export class EvaluationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    const userId = client.user.id;
    client.join(`user:${userId}`);
    console.log(`User ${userId} connected to Evaluation namespace`);
  }

  handleDisconnect(client: any) {
    const userId = client.user.id;
    console.log(`User ${userId} disconnected from Evaluation namespace`);
  }

  @OnEvent("evaluation.finished")
  handleEvaluationFinishedEvent(userId: number, payload: any) {
    const communicationPayload: EvaluationWorkerCommunicationDTO = {
      evaluationId: payload.evaluationId,
      url: payload.url,
      status: "completed",
      summary: {
        score: payload.score,
        title: payload.title,
        conform: payload.conform,
        date: payload.date,
      },
    };

    this.server.emit("evaluation:updated", communicationPayload);
    const userRoom = `user:${userId}`;
    this.server.to(userRoom).emit("notification", {
      status: "success",
      message: `O teu crawler para ${payload.url} terminou!`,
      details: communicationPayload,
    });
  }

  @OnEvent("evaluation.created")
  handleEvaluationCreatedEvent(payload: EvaluationWorkerCommunicationDTO) {
    console.log(
      "Emitting evaluation:created event with payload:",
      JSON.stringify(payload, null, 2),
    );
    this.server.emit("evaluation:new", payload);
  }

  @OnEvent("evaluation.deleted")
  handleEvaluationDeletedEvent(ids: string[]) {
    const payload = { ids };
    this.server.emit("evaluation:deleted", payload);
  }

  @OnEvent("evaluation.error")
  handleEvaluationErrorEvent(
    userId: number,
    payload: EvaluationWorkerCommunicationDTO,
  ) {
    const userRoom = `user:${userId}`;
    this.server.to(userRoom).emit("notification", {
      status: "error",
      message: `O teu evaluation para ${payload.url} encontrou um erro!`,
      details: payload,
    });
  }
}
