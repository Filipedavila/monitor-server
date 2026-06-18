import "reflect-metadata";
import { DataSource } from "typeorm";
import { Website } from "./domains/inventory/website/website.entity";
import { Page } from "./domains/inventory/page/page.entity";
import { User } from "./domains/identity/user/user.entity";

import { Tag } from "./domains/inventory/tag/tag.entity";
import { Organization } from "./domains/inventory/organization/organization.entity";



import { Log } from "./core/log/entities/log.entity";

import { Directory } from "./domains/inventory/directory/directory.entity";

import { AccessibilityStatement } from "./domains/compliance/accessibility-statement/entities/accessibility-statement.entity";


import { InvalidToken } from "./core/authentication/entitities/invalid-token.entity";
import { CrawlerWebsite } from "./domains/audit-engine/discovery/entities/crawler-website.entity";
import { CrawlerPage } from "./domains/audit-engine/discovery/entities/crawler-page.entity";
import { Role } from "./domains/identity/role/roles.entity";
import { Evaluation } from "./domains/audit-engine/evaluation/entities/evaluation.entity";
import { ManualEvaluation } from "./domains/audit-engine/manual-evaluation/manual-evaluation.entity";
import { Outbox } from "./core/outbox/outbox.entity";
import { Team } from "./domains/identity/team/team.entity";

const isProduction = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || 'localhost',
  username: process.env.DB_USER || "accessmonitor",
  password: process.env.DB_USER_PASSWORD || "v2password",
  database: process.env.DB_NAME || "Accessibility",
  entities: getAllEntities(),
  migrations: [
    isProduction 
      ? __dirname + "/migrations/**/*.js" 
      : __dirname + "/migrations/**/*.ts"
  ],
});

export function getAllEntities() {
  return [
    Role,
    User,
    Team,
    Website,
    Page,
    Tag,
    Organization,
    Evaluation,
    ManualEvaluation,
    Log,
    Directory,
    CrawlerWebsite,
    CrawlerPage,
    AccessibilityStatement,
    InvalidToken,
    Outbox
  ];
}
