import {
  Controller,
  Post,
  Get,
  Request,
  UseGuards,
  Param,
  UseInterceptors,
  Res,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { EvaluationService } from "../services/evaluation.service";
import { LoggingInterceptor } from "src/core/log/log.interceptor";
import {
  ApiBasicAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Evaluation } from "../entities/evaluation.entity";

@ApiBasicAuth()
@ApiTags("evaluations")
@ApiResponse({ status: 403, description: "Forbidden" })
@Controller("evaluations")
@UseInterceptors(LoggingInterceptor)
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @ApiOperation({
    summary: "Get evaluation results",
  })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Evaluation,
  })
  @UseGuards(AuthGuard("jwt"))
  @Get("")
  async getEvaluationResults(@Request() req: any): Promise<any> {
    const userId = req.user?.id;
    return await this.evaluationService.getEvaluations(userId);
  }

  @ApiOperation({
    summary: "Get evaluation results for a specific evaluation id",
  })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Evaluation,
  })
  @UseGuards(AuthGuard("jwt"))
  @Get(":evaluationId")
  async getEvaluationById(
    @Request() req: any,
    @Param("evaluationId") evaluationId: number,
  ): Promise<any> {
    return await this.evaluationService.getEvaluationResult(evaluationId);
  }

  @ApiOperation({
    summary: "Get evaluations detaiils for a specific page  ",
  })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Evaluation,
  })
  @UseGuards(AuthGuard("jwt"))
  @Get("page/:pageId")
  async getPageEvaluationDetails(
    @Request() req: any,
    @Param("pageId") pageId: number,
  ): Promise<any> {
    const userId = req.user?.id;
    // TODO evaluations add filters for page and in order and latests
    return await this.evaluationService.getEvaluations(userId);
  }

  @ApiOperation({
    summary:
      "Upload evaluation results from the AccessMonitor Extension on AMS",
  })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Evaluation,
  })
  @UseGuards(AuthGuard("jwt"))
  @Post("amp/extension/:pageId")
  async postAMPExtensionEvaluation(
    @Request() req: any,
    @Param("pageId") pageId: number,
  ): Promise<any> {
    const userId = req.user.id;
    const role_id = req.user.roleId;
    const data = req.body.data;
    return await this.evaluationService.saveExternalEvaluation(
      userId,
      role_id,
      pageId,
      data,
    );
  }

  @ApiOperation({
    summary:
      "Upload evaluation results from the AccessMonitor Extension on My Monitor",
  })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Evaluation,
  })
  @UseGuards(AuthGuard("jwt"))
  @Post("myMonitor/amp/extension/:pageId")
  async postMyMonitorAMPExtensionEvaluation(
    @Request() req: any,
    @Param("pageId") pageId: number,
  ): Promise<any> {
    const userId = req.user.id;
    const role_id = req.user.roleId;
    const data = req.body.data;
    return await this.evaluationService.saveExternalEvaluation(
      userId,
      role_id,
      pageId,
      data,
    );
  }

  /*
  @ApiOperation({ summary: "Return existing evaluations for a website " })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: Evaluation,
  })

  // TODO, Study implications of this logic and what is trying to be achieved with sample parameter
  @UseGuards(AuthGuard("jwt"))
  @Get("website/:website/evaluations/:sample")
  async getWebsitePageEvaluations(
    @Request() req: any,
    @Param("website") website: string,
    @Param("sample") sample: string,
    @Res() res: Response
  ): Promise<any> {
    const results = await this.evaluationService.findWebsiteEvaluations(
      decodeURIComponent(website),
      sample === "true"
    );
    const stream = new Readable({
      read() {
        results.forEach((result) => {
          this.push(JSON.stringify(result) + "\n");
        });
        this.push(null);
      },
    });
    res.setHeader("Content-Type", "application/json");
    stream.pipe(res);
  }*/
}
