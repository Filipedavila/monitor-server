import { Column, Index } from "typeorm";
import { BaseModel } from "./base.entity";
import {
  AccessLevel,
  AccessLevelCode,
} from "@core/security-authorization/entitities/access-level.entity";
export enum GranteeType {
  USER = "USER",
  ROLE = "ROLE",
  INSTITUTION = "INSTITUTION",
}

@Index("IDX_GRANTEE_ACCESS", ["granteeId", "granteeType", "accessLevel"])
export abstract class BaseAccess<T extends BaseModel> extends BaseModel {
  @Column({ name: "grantee_id", type: "int", unsigned: true })
  granteeId: number;

  @Column({ name: "grantee_type", type: "varchar", length: 50 })
  granteeType: GranteeType;

  @Column({
    name: "access_level",
    type: "varchar",
    length: 50,
    default: AccessLevel.VIEWER,
  })
  @Index()
  accessLevel: AccessLevelCode;

  abstract securedResource: T;
}
