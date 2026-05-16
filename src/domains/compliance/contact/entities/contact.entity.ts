import { BaseModel } from "../../../../common/entities/base.entity";
import { AccessibilityStatement } from "../../accessibility-statement/entities/accessibility-statement.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";

@Entity("contacts")
export class Contact extends BaseModel {
  @Column({
    type: "varchar",
    length: 255,
  })
  contactType: string;

  @Column({
    type: "varchar",
    length: 255,
  })
  contact: string;

  @ManyToOne(() => AccessibilityStatement )
  @JoinColumn({ name: "accessibility_statement_id" })
  accessibilityStatement: AccessibilityStatement;
}
