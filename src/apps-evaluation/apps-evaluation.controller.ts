import {
  Controller,
  Post,
  Get,
  UseGuards,
  Param,
  UseInterceptors,
  Body,
  InternalServerErrorException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AppsEvaluationService } from "./apps-evaluation.service";
import { success } from "../lib/response";
import { LoggingInterceptor } from "src/log/log.interceptor";
import {
  ApiBasicAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AppsEvaluation } from "./apps-evaluation.entity";
import { CreateAppsEvaluationDTO } from "./dto/create-apps-evaluation.dto";

@ApiBasicAuth()
@ApiTags("apps-evaluation")
@ApiResponse({ status: 403, description: "Forbidden" })
@Controller("apps-evaluation")
@UseInterceptors(LoggingInterceptor)
export class AppsEvaluationController {
  constructor(private readonly appsEvaluationService: AppsEvaluationService) {}

  @ApiOperation({ summary: "Create a new apps evaluation" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Boolean,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Post("create")
  async createAppsEvaluation(
    @Body() createAppsEvaluationDTO: CreateAppsEvaluationDTO
  ): Promise<any> {
    const evaluation = new AppsEvaluation();
    evaluation.AppId = createAppsEvaluationDTO.appId;
    evaluation.Title = createAppsEvaluationDTO.title;
    evaluation.Show_To = createAppsEvaluationDTO.showTo;
    evaluation.Conformance = createAppsEvaluationDTO.conformance;
    evaluation.Result = JSON.stringify(createAppsEvaluationDTO.result);
    evaluation.Date = new Date(createAppsEvaluationDTO.date);

    const createSuccess = await this.appsEvaluationService.createOne(evaluation);
    
    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }
  
  @ApiOperation({ summary: "Find latest apps evaluation of a specific application" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: AppsEvaluation,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Get("latest/:applicationId")
  async getLastestAppsEvaluation(
    @Param("applicationId") applicationId: number
  ): Promise<any> {
    return success(
      await this.appsEvaluationService.findLastestAppsEvaluation(applicationId)
    );
  }


  @ApiOperation({ summary: "Find all apps evaluations of a specific application" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Array<AppsEvaluation>,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Get("all/:applicationId")
  async getAllAppsEvaluation(
    @Param("applicationId") applicationId: number
  ): Promise<any> {
    return success(
      await this.appsEvaluationService.findAllAppsEvaluation(applicationId)
    );
  }

  @ApiOperation({ summary: "Find all apps evaluations" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Array<AppsEvaluation>,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Get("all")
  async getAllAppsEvaluations(): Promise<any> {
    return success(await this.appsEvaluationService.findAll());
  }

  @ApiOperation({ summary: "Find a specific apps evaluation info" })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: AppsEvaluation,
  })
  // @UseGuards(AuthGuard("apps-jwt-admin"))
  @Get("info/:appsEvaluationId")
  async getAppsEvaluationInfo(
    @Param("appsEvaluationId") appsEvaluationId: number
  ): Promise<any> {
    return success(await this.appsEvaluationService.findInfo(appsEvaluationId));
  }
}
