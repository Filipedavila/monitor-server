import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { AccessibilityStatement } from "../../../accessibility-statement/entities/accessibility-statement.entity";
import { BaseModel } from "../../../../../common/entities/base.entity";
@Entity("user_evaluations")
export class UserEvaluation extends BaseModel {
  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  title: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  url: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  participants: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  process: string;

  @Column({
    type: "text",
    nullable: true,
  })
  summary: string;

  @Column({
    type: "datetime",
    nullable: true,
  })
  date: any;

  @ManyToOne(() => AccessibilityStatement)
  @JoinColumn({ name: "accessibility_statement_id" })
  accessibilityStatement: AccessibilityStatement;
}
