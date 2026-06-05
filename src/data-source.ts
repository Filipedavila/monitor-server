import "reflect-metadata";
import { DataSource } from "typeorm";
import { Website } from "./domains/inventory/website/website.entity";
import { Page } from "./domains/inventory/page/page.entity";
import { User } from "./domains/identity/user/user.entity";

import { Tag } from "./domains/inventory/tag/tag.entity";
import { Organization } from "./domains/inventory/organization/organization.entity";

import { Observatory } from "./integrations/observatory/observatory.entity";
import { ObservatorySyncStatus } from "./integrations/observatory/observatory-sync-status.entity";


import { Log } from "./core/log/entities/log.entity";

import { Directory } from "./domains/inventory/directory/directory.entity";

import { AccessibilityStatement } from "./domains/compliance/accessibility-statement/entities/accessibility-statement.entity";
import { AutomaticStatement } from "./domains/compliance/possibly-trash/automatic-statement/entities/automatic-statement.entity";
import { ManualStatement } from "./domains/compliance/possibly-trash/manual-statement/entities/manual-statement.entity";
import { UserEvaluation } from "./domains/compliance/possibly-trash/user-evaluation/entities/user-evaluation.entity";
import { Contact } from "./domains/compliance/contact/entities/contact.entity";

import { InvalidToken } from "./core/authentication/entitities/invalid-token.entity";
import { CrawlerWebsite } from "./domains/audit-engine/discovery/entities/crawler-website.entity";
import { CrawlerPage } from "./domains/audit-engine/discovery/entities/crawler-page.entity";
import { Role } from "./domains/identity/role/roles.entity";
import { Evaluation } from "./domains/audit-engine/evaluation/entities/evaluation.entity";
import { EvaluationResult } from "./domains/audit-engine/evaluation/entities/evaluation-result.entity";
import { ManualEvaluation } from "./domains/audit-engine/manual-evaluation/manual-evaluation.entity";
import { Outbox } from "./core/outbox/outbox.entity";
import { Team } from "./domains/identity/team/team.entity";

const isProduction = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: "mysql",
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
    EvaluationResult,
    Observatory,
    ObservatorySyncStatus,
    ManualEvaluation,
    Log,
    Directory,
    CrawlerWebsite,
    CrawlerPage,
    AccessibilityStatement,
    AutomaticStatement,
    ManualStatement,
    UserEvaluation,
    Contact,
    InvalidToken,
    Outbox
  ];
}
