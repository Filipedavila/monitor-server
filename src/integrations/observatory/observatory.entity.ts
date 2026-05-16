import { BaseModel } from "../../common/entities/base.entity";
import { Entity, Column, CreateDateColumn } from "typeorm";

@Entity("observatory")
export class Observatory extends BaseModel {
  @Column({
    name: "global_statistics",
    type: "mediumtext",
    nullable: false,
  })
  globalStatistics: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
  })
  type: string;

  @CreateDateColumn({
    name: "created_at",
  })
  createdAt: Date;
}
