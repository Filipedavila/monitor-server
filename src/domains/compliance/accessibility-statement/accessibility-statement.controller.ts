import {
  Controller,
  Get,
  HttpCode,
  Param,
} from "@nestjs/common";
import { AccessibilityStatementService } from "./accessibility-statement.service";

@Controller("accessibility-statement")
export class AccessibilityStatementController {
  constructor(
    private readonly accessibilityStatementService: AccessibilityStatementService,
  ) {}

  @Get("website/:name")
  @HttpCode(200)
  async findOne(@Param("name") name: string) {
    return await this.accessibilityStatementService.findByWebsiteName(name);
  }

  @Get()
  @HttpCode(200)
  async findAll() {
    return await this.accessibilityStatementService.getASList();
  }

  @Get("id/:id")
  @HttpCode(200)
  async findOneById(@Param("id") id: number) {
    return await this.accessibilityStatementService.findById(id);
  }

  @Get("year")
  @HttpCode(200)
  async findAllByYear() {
    return await this.accessibilityStatementService.getByAge();
  }

  @Get("conformance")
  @HttpCode(200)
  async findAllByConformance() {
    return await this.accessibilityStatementService.getByConformance();
  }

  @Get("seal")
  @HttpCode(200)
  async findAllBySeal() {
    return await this.accessibilityStatementService.getBySeal();
  }

  @Get("state")
  @HttpCode(200)  
  async findAllByState() {
    return await this.accessibilityStatementService.getByState();
  }

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

  @Get("evaluations")
  @HttpCode(200)
  async findNumberOfEvaluationByType() {
    return await this.accessibilityStatementService.getNumberOfEvaluationByType();

  }
}
