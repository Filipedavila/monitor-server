import { BaseModel } from "../../../../../common/entities/base.entity";
import { AccessibilityStatement } from "../../../accessibility-statement/entities/accessibility-statement.entity";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from "typeorm";
@Entity("automatic_statements")
export class AutomaticStatement extends BaseModel {
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
  sample: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  tool: string;

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

  @ManyToOne(() => AccessibilityStatement  )
  @JoinColumn({ name: "accessibility_statement_id" })
  accessibilityStatement: AccessibilityStatement;
}
