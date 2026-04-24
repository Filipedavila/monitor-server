import {
  Controller,
  Post,
  Get,
  Request,
  UseGuards,
  Param,
  UseInterceptors,
  Body,
  InternalServerErrorException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { success } from "../../../../common/response";
import { LoggingInterceptor } from "src/core/log/log.interceptor";
import {
  ApiBasicAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AspectEvaluationService } from "./manual-evaluation.service";
import { AspectType } from  "./manual-evaluation.entity";

@ApiBasicAuth()
@ApiTags("manual-evaluation")
@ApiResponse({ status: 403, description: "Forbidden" })
@Controller("manual-evaluation") 
@UseInterceptors(LoggingInterceptor)
export class ManualEvaluationController {
  constructor(private readonly evaluationService: AspectEvaluationService) {}

  @ApiOperation({ summary: "Create a new aspect evaluation (content, functional, or transaction)" })
  @ApiResponse({ status: 200, description: "Success", type: Boolean })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Post(":type/create") 
  async createAspectEvaluation(
    @Param("type") type: AspectType, 
    @Body("jsonData") jsonData: any
  ): Promise<any> {
    
    const createSuccess = await this.evaluationService.createEvaluation(type, jsonData);

    if (!createSuccess) {
      throw new InternalServerErrorException(`Failed to create ${type} evaluation`);
    }

    return success(true);
  }

  @ApiOperation({ summary: "Find all evaluations for a specific aspect type" })
  @ApiResponse({ status: 200, description: "Success" })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Get(":type/all")
  async getAllByAspectType(@Param("type") type: AspectType): Promise<any> {
    return success(await this.evaluationService.findAllByType(type));
  }

  @ApiOperation({ summary: "Find all evaluations for a specific website" })
  @UseGuards(AuthGuard("jwt-monitor"))
  @Get("website/:id")
  async getWebsiteEvaluations(@Param("id") websiteId: number): Promise<any> {
    return success(await this.evaluationService.findAllByWebsite(websiteId));
  }
}