import {
  Controller,
  Get,
  Post,
  Param,
  Request,
  UseInterceptors,
  HttpCode,
} from "@nestjs/common";
import dns from "dns";
import ipRangeCheck from "ip-range-check";
import { RateLimit } from "nestjs-rate-limiter";
import { LoggingInterceptor } from "src/core/log/log.interceptor";
import {
  ApiBasicAuth,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { EvaluationService } from "src/domains/audit-engine/evaluation/services/evaluation.service";
import { AmpContract, AmpDocs } from "./amp.swagger";
import { ConfigService } from "@nestjs/config";
import { SecurityContext } from "src/core/authorization/SecurityContext";

@AmpDocs.controller()
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
  })
  @Get("eval/:url")
  @HttpCode(200)
  async evaluateUrl(
    @Request() req: any,
    @Param("url") url: string,
  ): Promise<any> {
    // TODO pu in a middleware or guard
    /*
    if (process.env.NAMESPACE !== undefined && process.env.REFERER) {
      if (!req.headers.referer?.startsWith(process.env.REFERER)) {
        return { status: 403, message: "Forbidden" };
      }
    }*/
    const urlDecoded = this.decodeBase64Url(url);

    const isValid = await this.checkIfValidUrl(decodeURIComponent(urlDecoded));

    if (!isValid) {
      return { status: 403, message: "Forbidden" };
    }
    const securityContext: SecurityContext = { user: { id: 0, username: "AMP Extension", role_slug:""} };
    return await this.evaluationService.evaluatePublicRequest(decodeURIComponent(urlDecoded));
  }

  @AmpDocs.evaluateHtml()
  @Post("eval/html")
  @HttpCode(200)
  async evaluateHtml(@Request() req: any): Promise<any> {
    return await this.evaluationService.evaluateHtml(req.body.html);
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

