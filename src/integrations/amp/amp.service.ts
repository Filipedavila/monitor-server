import { Injectable } from '@nestjs/common';
import {
  executeHtmlEvaluation,
  executeUrlEvaluation,
} from '@domains/audit-engine/evaluation/util/middleware';

import { ConfigService } from '@nestjs/config/dist/config.service';
import { validateUrlRestriction } from './util';

@Injectable()
export class AmpService {
  private readonly blackList: string[];
  constructor(private readonly configService: ConfigService) {
    this.blackList = (
      this.configService.get<string>('IP_BLACKLIST_RANGES') || ''
    ).split(',');
  }
  async evaluateUrl(url: string): Promise<any> {
    await validateUrlRestriction(url, this.blackList);

    return await executeUrlEvaluation(url);
  }

  async evaluateHtml(html: string): Promise<any> {
    return await executeHtmlEvaluation(html);
  }

}
