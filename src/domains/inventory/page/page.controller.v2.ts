import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PageService } from "../../domain/page/page.service";
import { JwtAuthGuard } from "@core/guards/jwt-auth.guard";
import { RolesGuard } from "@core/guards/roles.guard";
import { Roles } from "@core/decorators/roles.decorator";
import { CurrentUser } from "@core/decorators/current-user.decorator";
import { SecurityContext } from "@core/security/SecurityContext";
import { CreatePageDto } from "../dto/create-page.dto";
import { PagePaginationDto } from "../dto/page-pagination.dto";

@ApiTags("pages")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("pages")
export class PageController {
  constructor(private readonly pageService: PageService) {}

  // --- ADMIN OPERATIONS ---

  @ApiOperation({ summary: "Search and list all pages with security scope" })
  @Roles("admin")
  @Get()
  async findAll(
    @Query() queryDto: PagePaginationDto,
    @CurrentUser() securityContext: SecurityContext
  ) {
    return this.pageService.findAllSecure({
      securityContext,
      pagination: { limit: queryDto.size, page: queryDto.page },
      sorting: { [queryDto.sort]: queryDto.direction },
      filters: { search: queryDto.search },
    });
  }

  @ApiOperation({ summary: "Import page between contexts" })
  @Roles("admin")
  @Post("import")
  async import(@Body() dto: PageImportDto, @CurrentUser() context: SecurityContext) {
    // O Service agora decide a lógica de importação baseada no contexto
    return this.pageService.import(dto, context);
  }

  @ApiOperation({ summary: "Global page delete" })
  @Roles("admin")
  @Delete()
  async bulkDelete(@Body("ids") ids: number[], @CurrentUser() context: SecurityContext) {
    return this.pageService.deleteBulk(ids, context);
  }

  // --- MONITOR / USER OPERATIONS ---

  @ApiOperation({ summary: "Get pages belonging to a specific website" })
  @Get("website/:websiteId")
  async getByWebsite(
    @Param("websiteId", ParseIntPipe) websiteId: number,
    @CurrentUser() context: SecurityContext
  ) {
    return this.pageService.findAllSecure({
      securityContext: context,
      filters: { websiteId } as any,
    });
  }

  @ApiOperation({ summary: "Add new pages to a context" })
  @Post()
  async create(
    @Body() dto: CreatePageDto,
    @CurrentUser() context: SecurityContext
  ) {
    // SRP: Apenas cria a entidade e associa ao contexto/website
    return this.pageService.create(dto, context);
  }

  @ApiOperation({ summary: "Remove pages from a website association" })
  @Patch("detach")
  async detachFromWebsite(
    @Body("pageIds") ids: number[],
    @Body("websiteId") websiteId: number,
    @CurrentUser() context: SecurityContext
  ) {
    return this.pageService.detachFromWebsite(ids, websiteId, context);
  }
}