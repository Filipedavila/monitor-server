import {
  Controller,
  Get,
  Post,
  Param,
  Request,
  UseInterceptors,
} from "@nestjs/common";
import { success, accessDenied } from "../../common/response";
import { readFileSync } from "fs";
import dns from "dns";
import ipRangeCheck from "ip-range-check";
import { RateLimit } from "nestjs-rate-limiter";
import { LoggingInterceptor } from "src/core/log/log.interceptor";
import {
  ApiBasicAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { EvaluationService } from "src/domains/audit-engine/evaluation/services/evaluation.service";
import { AmpContract, AmpDocs } from "./amp.contracts";
import { ConfigService } from "@nestjs/config";

@ApiBasicAuth()
@ApiTags("amp")
@ApiResponse({ status: 403, description: "Forbidden" })
@Controller("amp")
@UseInterceptors(LoggingInterceptor)
export class AmpController implements AmpContract {
  private readonly blackList: string[];
  constructor(
    private readonly evaluationService: EvaluationService,
    private readonly configService: ConfigService,
  ) {
    this.blackList = (
      this.configService.get<string>("IP_BLACKLIST_RANGES") || ""
    ).split(",");
  }

  @AmpDocs.evaluateUrl()
  @RateLimit({
    keyPrefix: "amp",
    points: 3,
    duration: 1 * 60,
    blockDuration: 1 * 60,
    customResponseSchema: () => accessDenied(),
  })
  @Get("eval/:url")
  async evaluateUrl(
    @Request() req: any,
    @Param("url") url: string,
  ): Promise<any> {
    if (process.env.NAMESPACE !== undefined && process.env.REFERER) {
      if (!req.headers.referer?.startsWith(process.env.REFERER)) {
        return accessDenied();
      }
    }
    const urlDecoded = this.decodeBase64Url(url);

    const isValid = await this.checkIfValidUrl(decodeURIComponent(urlDecoded));

    if (!isValid) {
      return accessDenied();
    }

    return success(
      await this.evaluationService.evaluatePublicRequest(
        decodeURIComponent(urlDecoded),
      ),
    );
  }

  @AmpDocs.evaluateHtml()
  @Post("eval/html")
  async evaluateHtml(@Request() req: any): Promise<any> {
    return success(await this.evaluationService.evaluateHtml(req.body.html));
  }

  private decodeBase64Url(url: string): string {
    return Buffer.from(url, "base64").toString("utf-8");
  }

  private checkIfValidUrl(url: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      dns.lookup(this.fixUrl(url), (err: any, addr: any) => {
        const isValid = !ipRangeCheck(addr, this.blackList);
        resolve(isValid);
      });
    });
  }

  private fixUrl(url: string): string {
    url = url.replace("http://", "").replace("https://", "");
    return url.split("/")[0];
  }
}

function getRequestIp(): string {
  return "amp";
}
