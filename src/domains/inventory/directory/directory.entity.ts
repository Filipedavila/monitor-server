import { Entity, Column, JoinTable, ManyToMany } from "typeorm";
import { Tag } from "../tag/tag.entity";
import { AuditableEntity } from "../../../common/entities/auditable.entity";

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
  method: number;

  @ManyToMany(() => Tag, (tag) => tag.directories)
  @JoinTable({
    name: "directory_tags",
    joinColumn: { name: "directory_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "tag_id", referencedColumnName: "id" },
  })
  tags: Tag[];
}
