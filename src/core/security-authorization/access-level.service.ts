import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  AccessLevelCode,
  AccessLevelEntity,
} from "./entitities/access-level.entity";
import { Repository } from "typeorm";

@Injectable()
export class AccessLevelProvider implements OnModuleInit {
  private weightsCache: Record<AccessLevelCode, number>;
  private readonly logger = new Logger(AccessLevelProvider.name);

  constructor(
    @InjectRepository(AccessLevelEntity)
    private readonly repo: Repository<AccessLevelEntity>,
  ) {}

  async onModuleInit() {
    try {
      await this.loadWeights();
    } catch (error) {
      this.logger.error(
        "FATAL: Failed to load security weights. Shuting down...",
        error,
      );
      process.exit(1);
    }
  }

  private async loadWeights() {
    await this.refreshCache();
  }

  async refreshCache() {
    const levels = await this.repo.find();
    this.weightsCache = levels.reduce(
      (acc, level) => {
        acc[level.type] = level.weight;
        return acc;
      },
      {} as Record<AccessLevelCode, number>,
    );
  }

  getSatisfyingLevels(minLevel: AccessLevelCode): AccessLevelCode[] {
    const minWeight = this.weightsCache[minLevel];
    if (minWeight === undefined) {
      this.logger.warn(
        `Requested access level "${minLevel}" is unknown. Defaulting to weight 0 (granting no levels).`,
      );
      return [];
    }

    return Object.keys(this.weightsCache).filter(
      (code) => this.weightsCache[code] >= minWeight,
    ) as AccessLevelCode[];
  }
}
