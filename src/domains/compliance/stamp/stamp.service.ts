import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { WebsiteStamp } from "./stamp.entity";
import { AuditStatus } from "src/common/enums/audit-status.enum";
import { StampLevel } from "./enums/stamp-level.enum";

@Injectable()

export class WebsiteStampService {
  constructor(
    @InjectRepository(WebsiteStamp)
    private readonly stampRepo: Repository<WebsiteStamp>,
  ) {}


  async getStampByWebsiteId(websiteId: number): Promise<WebsiteStamp | null> {
    return this.stampRepo.findOne({ where: { websiteId } });
  }

  async upsertStamp(
    websiteId: number,
    status: StampLevel,
    createdAt:Date,
    createdById: number,
  ): Promise<WebsiteStamp> {
    let stamp = await this.getStampByWebsiteId(websiteId);

    if (!stamp) {
      stamp = this.stampRepo.create({ 
        websiteId,
        createdById,
        createdAt 
      });
    }else{
    stamp.updatedAt = createdAt;
    stamp.stamp = status;
    }
    return this.stampRepo.save(stamp);
  }
}