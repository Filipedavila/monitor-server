import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AppService } from "./app.service";
import { AppDocs } from "./app.swagger";
import { JwtAuthGuard } from "./core/authentication/guards/jwt-auth.guard";
import { RolesGuard } from "./core/authorization/guards/roles.guard";
import { Roles } from "./core/authorization/decorators/roles.decorator";

@AppDocs.controller()
@Controller()
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles("admin")
export class AppController {
  constructor(private readonly appService: AppService) {}


}