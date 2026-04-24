import { Entity, Column, JoinColumn, ManyToOne } from "typeorm";
import { AuditableEntity } from "../../../../common/entities/auditable.entity";
import { Website } from "../../../inventory/website/website.entity";

import { State } from "../state";

@Entity("accessibility_statements")
export class AccessibilityStatement extends AuditableEntity {
  @ManyToOne(() => Website,  {
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn({ name: "website_id" })
  website: Website;

  @Column({ type: "varchar", length: 255, nullable: false })
  url: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  conformance: string;

  @Column({ type: "text", nullable: false })
  evidence: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  seal: string;

  @Column({ name: "statement_date", type: "datetime", nullable: true })
  statementDate: Date;

  @Column({ type: "enum", enum: State })
  state: State;

  @Column({ type: "varchar", length: 255 })
  hash: string;

}
