import { Entity, Column, ManyToMany, JoinTable } from "typeorm";

import { AuditableEntity } from "../../../common/entities/auditable.entity";
import { BaseWebsite } from "src/common/types";
import { Directory } from "../directory/directory.entity";

@Entity("tags")
export class Tag extends AuditableEntity {
  
  @Column({ type: "varchar", length: 255, nullable: false })
  name: string;

  @ManyToMany("Website", "Tag")
  @JoinTable({
    name: "website_tags",
    joinColumn: { name: "tag_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "website_id", referencedColumnName: "id" },
  })
  websites: BaseWebsite[];

  @ManyToMany("Directory", "Tag")
  @JoinTable({
    name: "directory_tags",
    joinColumn: { name: "tag_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "directory_id", referencedColumnName: "id" ,},
  })
  directories: Directory[];

  @Column({
    name: "is_official",
    type: "tinyint",
    default: 0,
  })
  isOfficial: boolean;
}
