import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
} from "@nestjs/common";
import { LogService } from "./log.service";
import { createReadStream } from "fs";
import { join } from "path";
import { Response } from "express";
import { AuthGuard } from "@nestjs/passport";
import { JwtAuthGuard } from "../authentication/guards/jwt-auth.guard";
import { RolesGuard } from "../authorization/guards/roles.guard";
import { Roles } from "../authorization/decorators/roles.decorator";

@UseGuards(JwtAuthGuard,RolesGuard)
@Roles("admin")
@Controller("log")
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get("error-log/:fileName")
  async getErrorLog(@Res() res: Response, @Param("fileName") fileName: string) {
    const path = "./error-log/" + fileName;
    if (path) {
      const file = createReadStream(join(process.cwd(), path));
      file.pipe(res);
    }
  }

  @Get("error-log")
  async getErrorLogList() {
    return this.logService.listErrorLog();
  }

  @Get("action-log")
  async getActionLogList() {
    return this.logService.listActionLog();
  }

  @Get("action-log/:fileName")
  async getActionLog(
    @Res() res: Response,
    @Param("fileName") fileName: string,
  ) {
    const path = "./action-log/" + fileName;
    if (path) {
      const file = createReadStream(join(process.cwd(), path));
      file.pipe(res);
    }
  }
}
