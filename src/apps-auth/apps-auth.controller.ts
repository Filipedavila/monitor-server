import {
  Controller,
  InternalServerErrorException,
  UnauthorizedException,
  Request,
  Post,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AppsAuthService } from "./apps-auth.service";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import {
  ApiBasicAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

@ApiBasicAuth()
@ApiTags("apps-auth")
@ApiResponse({ status: 403, description: "Forbidden" })
@Controller("apps-auth")
@UseInterceptors(LoggingInterceptor)
export class AppsAuthController {
  constructor(private readonly appsAuthService: AppsAuthService) {}

  @ApiOperation({ summary: "Login in AMS apps" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("local"))
  @Post("login")
  async login(@Request() req: any): Promise<any> {
    const token = this.appsAuthService.login(req.user);
    if (req.user.Type !== req.body.type) {
      throw new UnauthorizedException();
    } else {
      const date = new Date()
        .toISOString()
        .replace(/T/, " ")
        .replace(/\..+/, "");
      const updatedLogin = await this.appsAuthService.updateUserLastLogin(
        req.user.UserId,
        date
      );
      if (!updatedLogin) {
        throw new InternalServerErrorException();
      }

      return success(token);
    }
  }

  @ApiOperation({ summary: "Logout in AMS apps" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  @UseGuards(AuthGuard("jwt"))
  @Post("logout")
  async logout(@Request() req: any): Promise<any> {
    const token = req.headers.authorization.split(" ")[1];
    return success(await this.appsAuthService.logout(token));
  }
}
