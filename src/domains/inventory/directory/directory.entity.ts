import { Entity, Column, JoinTable, ManyToMany } from "typeorm";
import { Tag } from "../tag/tag.entity";
import { AuditableEntity } from "../../../common/entities/auditable.entity";
export enum TagMatchingStrategy {
  MATCH_ALL = 0, 
  
  MATCH_ANY = 1
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
  tagMatchingStrategy:TagMatchingStrategy;

  @ManyToMany(() => Tag)
  @JoinTable({
    name: "directory_tags",
    joinColumn: { name: "directory_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "tag_id", referencedColumnName: "id" },
  })
  tags: Tag[];
}
