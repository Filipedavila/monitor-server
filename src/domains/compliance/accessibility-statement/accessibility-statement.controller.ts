import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from "@nestjs/common";
import { AccessibilityStatementService } from "./accessibility-statement.service";
import { AccessibilityStatementQueryDTO } from "./dto/request/accessibility-statement-request.dto";
import { CurrentUser } from "src/core/authorization/decorators/current-user.decorator";
import { AuthenticatedUser } from "src/core/authentication/interfaces/types";
import { AccessibilityStatementDto } from "./dto/accessibility-statement.dto";

@Controller("accessibility-statement")
export class AccessibilityStatementController {
  constructor(
    private readonly accessibilityStatementService: AccessibilityStatementService,
  ) {}

  @Get()
  @HttpCode(200)
  async findAll( @CurrentUser() user: AuthenticatedUser, @Query() query: AccessibilityStatementQueryDTO) {
    return await this.accessibilityStatementService.getAll(user, query);
  }

  @Get(":id")
  @HttpCode(200)
  async findOneById(@Param("id", ParseIntPipe) id: number) {
    return await this.accessibilityStatementService.findById(id);
  }

  @Post("")
  @HttpCode(200)
  async upsert(@Body() dto: AccessibilityStatementDto) {
    return await this.accessibilityStatementService.upsertStatement(dto);
  }

  @Delete(":id")
  @HttpCode(204)
  async deleteById(@Param("id", ParseIntPipe) id: number) {
    await this.accessibilityStatementService.deleteById(id);
  }


/* Not bounded contextual endpoints - to be used in the future for the directory
  @Get("directory/state")
  @HttpCode(200)
  async findAllByDirectoryState() {
    return await this.accessibilityStatementService.getByDirectoryState();
  }

  @Get("directory/seal")
  @HttpCode(200)
  async findAllByDirectorySeal() {
    return await this.accessibilityStatementService.getByDirectorySeal(); 
    
  }

  @Get("directory/conformance")
  @HttpCode(200)
  async findAllByDirectoryConformity() {
    return await this.accessibilityStatementService.getByDirectoryConformity();
  }

  @Get("directory/OPAW")
  @HttpCode(200)
  async findAllByDirectoryWebsite() {
    return await this.accessibilityStatementService.getOPAWTable();
  }
*/
}
