import "reflect-metadata";
import { DataSource } from "typeorm";
import { Website } from "./domains/inventory/website/website.entity";
import { Page } from "./domains/inventory/page/page.entity";
import { User } from "./domains/identity/user/user.entity";

import { Tag } from "./domains/inventory/tag/tag.entity";
import { Organization } from "./domains/identity/organization/organization.entity";

import { Observatory } from "./integrations/observatory/observatory.entity";
import { ObservatorySyncStatus } from "./integrations/observatory/observatory-sync-status.entity";

import { FunctionalAspects } from "./domains/audit-engine/criteria/functional-aspects/functional-aspects.entity";
import { ContentAspects } from "./domains/audit-engine/criteria/content-aspects/content-aspects.entity";
import { Log } from "./core/log/entities/log.entity";
import { GovUser } from "./domains/identity/gov-user/entities/gov-user.entity";
import { Dump } from "./core/dump/entities/dump.entity";
import { Directory } from "./domains/inventory/directory/directory.entity";

import { AccessibilityStatement } from "./domains/compliance/accessibility-statement/entities/accessibility-statement.entity";
import { AutomaticStatement } from "./domains/compliance/possibly-trash/automatic-statement/entities/automatic-statement.entity";
import { ManualStatement } from "./domains/compliance/possibly-trash/manual-statement/entities/manual-statement.entity";
import { UserEvaluation } from "./domains/compliance/possibly-trash/user-evaluation/entities/user-evaluation.entity";
import { Contact } from "./domains/compliance/contact/entities/contact.entity";
import { CollectionDate } from "./domains/compliance/collection-date/entities/collection-date.entity";

import { InvalidToken } from "./core/auth/entitities/invalid-token.entity";
import { CrawlWebsite } from "./domains/audit-engine/discovery/entities/crawler-website.entity";
import { CrawlPage } from "./domains/audit-engine/discovery/entities/crawler-page.entity";
import { Role } from "./domains/identity/user/roles.entity";
import { Evaluation } from "./domains/audit-engine/evaluation/entities/evaluation.entity";
import { EvaluationResult } from "./domains/audit-engine/evaluation/entities/evaluation-result.entity";
import { TransactionAspects } from "./domains/audit-engine/criteria/transaction-aspects/transaction-aspects.entity";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  username: "accessmonitor",
  password: "v2password",
  database: "Accessibility",
  entities: getAllEntities(),
  migrations: ["migrations/**/*.ts"],
});

export function getAllEntities() {
  return [
    Role,
    User,
    Website,
    Page,
    Tag,
    Organization,
    Evaluation,
    EvaluationResult,
    Observatory,
    ObservatorySyncStatus,
    TransactionAspects,
    FunctionalAspects,
    ContentAspects,
    Log,
    GovUser,
    Dump,
    Directory,
    CrawlWebsite,
    CrawlPage,
    AccessibilityStatement,
    AutomaticStatement,
    ManualStatement,
    UserEvaluation,
    Contact,
    CollectionDate,
    InvalidToken,
  ];
}
