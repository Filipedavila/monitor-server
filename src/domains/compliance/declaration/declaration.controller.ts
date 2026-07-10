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
import { FgaGuard } from "src/core/authorization/guards/fda.guard";
import { FgaAuthorized } from "src/core/authorization/decorators/fga-authorization.decorator";

@DeclarationDocs.controller()
@UseGuards(JwtAuthGuard,RolesGuard,FgaGuard)
@Controller("websites/:websiteId/declaration")
export class WebsiteDeclarationController {
  constructor(private readonly declarationService: WebsiteDeclarationService) {}
  
  @DeclarationDocs.getDeclaration()
  @Roles(RoleSlug.ADMIN)
  @FgaAuthorized({
            objectType: "role",
            action: "can_view_users",
            resourceIdResolver: () => "ams"
      })
  @Get("")
  async getDeclaration(
    @Param("websiteId", ParseIntPipe) websiteId: number
  ) {
    return this.declarationService.getDeclarationByWebsiteId(websiteId);
  }
  
  @DeclarationDocs.upsertDeclaration()
  @Roles(RoleSlug.ADMIN)
  @FgaAuthorized({
            objectType: "role",
            action: "can_edit_users",
            resourceIdResolver: () => "ams"
  })
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