import { Entity, Column, JoinTable, ManyToMany } from "typeorm";
import { AuditableEntity } from "../../../common/entities/auditable.entity";
export enum TagMatchingStrategy {
  MATCH_ALL = 0, 
  
  MATCH_ANY = 1
}
interface TagBase {
  id: number;
  name: string;
  isOfficial: boolean;
}
@Entity("directories")
export class Directory extends AuditableEntity {
  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
  })
  name: string;

  @Column({
    name: "show_in_observatory",
    type: "tinyint",
    width: 1,
    default: 0,
  })
  showInObservatory: number;

  @Column({
    type: "tinyint",
    width: 1,
    default: 0,
  })
  tagMatchingStrategy: TagMatchingStrategy;

  @ManyToMany("Tag", "Directory")
  @JoinTable({
    name: "directory_tags",
    joinColumn: { name: "directory_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "tag_id", referencedColumnName: "id" },
  })
  tags: TagBase[];
}
