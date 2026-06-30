import { 
  Controller, 
  Get, 
  Put, 
  Body, 
  Param, 
  ParseIntPipe, 
  HttpStatus, 
  HttpCode, 
  UseGuards
} from "@nestjs/common";
import { WebsiteStampService } from "./stamp.service";
import { UpdateStampDto } from "./dto/update-stamp.dto";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { StampDocs } from "./stamp.swagger";

@StampDocs.controller()
@UseGuards(JwtAuthGuard,RolesGuard)
@Controller("websites/:websiteId/stamp")
export class WebsiteStampController {
  constructor(private readonly stampService: WebsiteStampService) {}
  
  @StampDocs.getStamp()
  @Roles(RoleSlug.ADMIN)
  @Get()
  async getStamp(
    @Param("websiteId", ParseIntPipe) websiteId: number
  ) {
    return this.stampService.getStampByWebsiteId(websiteId);
  }

  @StampDocs.upsertStamp()
  @Put()
  @Roles(RoleSlug.ADMIN)
  @HttpCode(HttpStatus.OK)
  async upsertStamp(
    @CurrentUser() user: AuthenticatedUser,
    @Param("websiteId", ParseIntPipe) websiteId: number,
    @Body() dto: UpdateStampDto,
  ) {
    return this.stampService.upsertStamp(
      websiteId,
      dto.stampLevel,
      dto.dateStamp,
      user.id,
    );
  }
}