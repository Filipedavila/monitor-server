import "reflect-metadata";
import { DataSource } from "typeorm";
import { Website } from "./domains/inventory/website/website.entity";
import { Page } from "./domains/inventory/page/page.entity";
import { User } from "./domains/identity/user/user.entity";
import { Tag } from "./domains/inventory/tag/tag.entity";
import { Log } from "./core/log/entities/log.entity";
import { Directory } from "./domains/inventory/directory/directory.entity";
import { AccessibilityStatement } from "./domains/compliance/accessibility-statement/entities/accessibility-statement.entity";
import { InvalidToken } from "./core/authentication/entitities/invalid-token.entity";
import { CrawlerWebsite } from "./domains/audit-engine/discovery/crawler-website/entities/crawler-website.entity";
import { CrawlerPage } from "./domains/audit-engine/discovery/crawler-page/crawler-page.entity";
import { Role } from "./domains/identity/role/roles.entity";
import { Evaluation } from "./domains/audit-engine/evaluation/entities/evaluation.entity";
import { ManualEvaluation } from "./domains/audit-engine/manual-evaluation/manual-evaluation.entity";
import { Outbox } from "./core/outbox/outbox.entity";
import { Team } from "./domains/identity/team/team.entity";
import { WebsiteStamp } from "./domains/compliance/stamp/stamp.entity";
import { WebsiteDeclaration } from "./domains/compliance/declaration/declaration.entity";
import { Context } from "./domains/inventory/context/context.identity";
import { Institution } from "./domains/inventory/institution/institution.entity";
import { TeamWebsites } from "./domains/allocations/relations/team-websites/team-websites.entity";
import { UserWebsite } from "./domains/allocations/relations/user-websites/user-websites.entity";
import { TeamMembers } from "./domains/allocations/relations/team-members/team-members.entity";
import { TagWebsite } from "./domains/allocations/relations/tag-websites/tag-website.entity";
import { UnpublishedEvaluation } from "./domains/audit-engine/evaluation/entities/unpublished-evaluation.entity";

const isProduction = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || "accessmonitor",
  password: process.env.DB_USER_PASSWORD || "v2password",
  database: process.env.DB_NAME || "Accessibility",
  entities: [
    Role,
    User,
    Team,
    TeamMembers,
    Context,
    Website,
    WebsiteStamp,
    WebsiteDeclaration,
    TeamWebsites,
    UserWebsite,
    Page,
    Tag,
    TagWebsite,
    Evaluation,
    UnpublishedEvaluation,
    ManualEvaluation,
    Log,
    Directory,
    Institution,
    CrawlerWebsite,
    CrawlerPage,
    AccessibilityStatement,
    InvalidToken,
    Outbox
  ],
  migrations: [
    isProduction 
      ? __dirname + "/migrations/*.js" 
      : "src/migrations/*.ts"
  ],
  synchronize: false,
  logging: !isProduction,
  })