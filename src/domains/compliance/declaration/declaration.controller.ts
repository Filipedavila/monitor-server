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
import { WebsiteDeclarationService } from "./declaration.service";
import { UpdateDeclarationDto } from "./dto/update-declaration.dto";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { DeclarationDocs } from "./declaration.swagger";

@DeclarationDocs.controller()
@UseGuards(JwtAuthGuard,RolesGuard)
@Controller("websites/:websiteId/declaration")
export class WebsiteDeclarationController {
  constructor(private readonly declarationService: WebsiteDeclarationService) {}
  
  @DeclarationDocs.getDeclaration()
  @Roles(RoleSlug.ADMIN)
  @Get("")
  async getDeclaration(
    @Param("websiteId", ParseIntPipe) websiteId: number
  ) {
    return this.declarationService.getDeclarationByWebsiteId(websiteId);
  }
  
  @DeclarationDocs.upsertDeclaration()
  @Roles(RoleSlug.ADMIN)
  @Put()
  @HttpCode(HttpStatus.OK)
  async upsertDeclaration(
    @CurrentUser() user: AuthenticatedUser,
    @Param("websiteId", ParseIntPipe) websiteId: number,
    @Body() dto: UpdateDeclarationDto,
  ) {
    return this.declarationService.upsertDeclaration(
      websiteId,
      dto.status,
      dto.dateDeclaration,
      user.id
    );
  }
}