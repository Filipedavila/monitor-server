import { Injectable, OnModuleInit } from "@nestjs/common";
import { DirectoryService } from "./domains/inventory/directory/directory.service";
import { TagService } from "./domains/inventory/tag/tag.service";
import { OrganizationService } from "./domains/inventory/organization/organization.service";
import { WebsiteService } from "./domains/inventory/website/website.service";
import { PageService } from "./domains/inventory/page/page.service";
import { UserService } from "./domains/identity/user/user.service";
import { ObservatoryService } from "./integrations/observatory/observatory.service";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger("Bootstrap");
  constructor(
    private configService: ConfigService,
    private readonly observatoryService: ObservatoryService,
  ) {}
  onModuleInit() {
    const nodeEnv = this.configService.get("NODE_ENV");
    const authMethod = this.configService.get("APP_AUTH_METHOD");
    const secretKey = this.configService.get("SECRET_KEY");
    const redisHost = this.configService.get("REDIS_HOST");
    const redisPort = this.configService.get("REDIS_PORT");
    const bullBoardRoute = this.configService.get("BULL_BOARD_ROUTE");
    const dbHost = this.configService.get("DB_HOST");
    const dbPort = this.configService.get("DB_PORT");
    const dbUsername = this.configService.get("DB_USERNAME");
    const dbDatabase = this.configService.get("DB_DATABASE");
    const mongoUri = this.configService.get("MONGO_URI");
    const paginationMaxLimit = this.configService.get("PAGINATION_MAX_LIMIT");
    const paginationDefaultLimit = this.configService.get(
      "PAGINATION_DEFAULT_LIMIT",
    );
    const ipBlacklistRanges = this.configService.get("IP_BLACKLIST_RANGES");
    const fgaApiUrl = this.configService.get("FGA_API_URL");
    const fgaStoreId = this.configService.get("FGA_STORE_ID");
    const fgaModelId = this.configService.get("FGA_MODEL_ID");
    const fgaAuthModel = this.configService.get("FGA_AUTH_MODEL");
    const configs = [
      { label: "NODE_ENV", value: nodeEnv },
      { label: "AUTH_METHOD", value: authMethod },
      { label: "SECRET_KEY", value: secretKey ? "✅ PRESENT" : "❌ MISSING" },
      { label: "REDIS_HOST", value: redisHost },
      { label: "REDIS_PORT", value: redisPort },
      { label: "BULL_BOARD_ROUTE", value: bullBoardRoute },
      { label: "DB_HOST", value: dbHost },
      { label: "DB_PORT", value: dbPort },
      { label: "DB_USERNAME", value: dbUsername },
      { label: "DB_DATABASE", value: dbDatabase },
      { label: "MONGO_URI", value: mongoUri ? "✅ PRESENT" : "❌ MISSING" },
      { label: "PAGINATION_MAX_LIMIT", value: paginationMaxLimit },
      { label: "PAGINATION_DEFAULT_LIMIT", value: paginationDefaultLimit },
      { label: "IP_BLACKLIST_RANGES", value: ipBlacklistRanges ? "✅ PRESENT" : "❌ NONE PROVIDED"  },
      { label: "FGA_API_URL", value: fgaApiUrl },
      { label: "FGA_STORE_ID", value: fgaStoreId ? "✅ PRESENT" : "❌ MISSING" },
      { label: "FGA_MODEL_ID", value: fgaModelId ? "✅ PRESENT" : "❌ MISSING" }
    ];

    this.logger.log("┌──────────────────────────────────────────┐");
    this.logger.log("│          CONFIGURATION AUDIT             │");
    this.logger.log("├──────────────────────────────────────────┤");
    configs.forEach((config) => {
      this.logger.log(
        `│ ${config.label.padEnd(16)} : ${String(config.value).padEnd(20)} │`,
      );
    });
    this.logger.log("└──────────────────────────────────────────┘");
  }
  getHello(): string {
    return "Hello World!";
  }

  async getObservatoryStats(): Promise<any> {
          throw new Error("Method not implemented.");
  /*
    const [directories, tags, entities, websites, pages] = await Promise.all([
      this.directoryService.findNumberOfObservatory(),
      this.tagService.findNumberOfObservatory(),
      this.entityService.findNumberOfObservatory(),
      this.websiteService.findNumberOfObservatory(),
      this.pageService.findNumberOfObservatory(),
    ]);

    return {
      directories,
      tags,
      entities,
      websites,
      pages,
    };
    */
  }

  async getTotalStats(): Promise<any> {
    throw new Error("Method not implemented.");
    /*
    const [
      directories,
      tags,
      entities,
      websites,
      pages,
      amsUsers,
      myMonitorUsers,
      studyMonitorUsers,
      govUsers,
    ] = await Promise.all([
      this.directoryService.count(),
      this.tagService.count(),
      this.entityService.count(),
      this.websiteService.count(),
      this.pageService.count(),
      this.userService.findNumberOfAMS(),
      this.userService.findNumberOfMyMonitor(),
      this.userService.findNumberOfStudyMonitor(),
      this.govUserService.findTotal(),
    ]);

    return {
      directories,
      tags,
      entities,
      websites,
      pages,
      users: amsUsers + myMonitorUsers + studyMonitorUsers,
      govUsers,
    };
    */
  }

  async getMyMonitorStats(): Promise<any> {
    throw new Error("Method not implemented.");
    /*
    const [users, websites, pages] = await Promise.all([
      this.userService.findNumberOfMyMonitor(),
      this.websiteService.findNumberOfMyMonitor(),
      this.pageService.findNumberOfMyMonitor(),
    ]);

    return {
      users,
      websites,
      pages,
    };
    */
  }
/*
  async getTotalsData(): Promise<any> {
    // Return new comprehensive structure including ALL system data
    // (observatory + mymonitor + AMS-only data)
    return await this.observatoryService.buildComprehensiveTotals();
  }
/*
  async getTotalsPracticesData(): Promise<any> {
    // Return practice table data from all system data
    return await this.observatoryService.buildComprehensivePracticesData();
  }*/
}
