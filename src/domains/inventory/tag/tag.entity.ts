import { Entity, Column } from "typeorm";

import { AuditableEntity } from "../../../common/entities/auditable.entity";

@Entity("tags")
export class Tag extends AuditableEntity {
  
  @Column({ type: "varchar", length: 255, nullable: false })
  name: string;

}
