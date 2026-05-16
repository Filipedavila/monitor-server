import {
  Body,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { StampService } from "./stamp.service";
import { LoggingInterceptor } from "src/core/log/log.interceptor";
import { PageUrlDto } from "./dto/create-stamp.dto";
import { StampDocs } from "./stamp.swagger";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { Roles } from "src/core/authorization/decorators/roles.decorator";

@StampDocs.controller()
@Controller("stamp")
@UseInterceptors(LoggingInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
export class StampController {
  constructor(private readonly stampService: StampService) {}

  @StampDocs.generateAll()
  @Roles("admin")
  @Post("all")
  async generateAllWebsitesDigitalStamp(): Promise<any> {
    const errors = await this.stampService.generateAllWebsitesDigitalStamp();
    return errors.length === 0 ? true : false;
  }

  @StampDocs.generateSpecific()
  @Roles("admin")
  @Post("websites")
  async generateWebsiteDigitalStamp(
    @Body() pageUrlDto: PageUrlDto,
  ): Promise<any> {
    const websitesId = pageUrlDto.websitesId;
    return await this.stampService.generateWebsitesDigitalStamp(websitesId);
  }
}