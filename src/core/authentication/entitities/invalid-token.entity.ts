import { BaseModel } from "../../../common/entities/base.entity";
import { Entity, Column, Index } from "typeorm";

@Entity("invalid_tokens")
export class InvalidToken extends BaseModel {
  @Index("IDX_INVALID_TOKEN_HASH")
  @Column({
    name: "token",
    type: "varchar",
    length: 1024,
    nullable: false
  })
  token: string;

  @Column({
    name: "expires_at",
    type: "timestamp",
    nullable: false
  })
  expiresAt: Date;
}
