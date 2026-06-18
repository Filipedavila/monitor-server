import { Entity, Column, JoinTable, ManyToMany } from "typeorm";
import { AuditableEntity } from "../../../common/entities/auditable.entity";

export const TAG_MATCHING_STRATEGIES = {'MATCH_ALL': 'MATCH_ALL', 'MATCH_ANY': 'MATCH_ANY'} as const;

export type TagMatchingStrategyType = typeof TAG_MATCHING_STRATEGIES[keyof typeof TAG_MATCHING_STRATEGIES];

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
    default: false,
  })
  showInObservatory: boolean;

  @Column({
    type: "enum",
    enum: ['MATCH_ALL', 'MATCH_ANY'],
    default: 'MATCH_ALL',
  })
  tagMatchingStrategy: TagMatchingStrategyType;

  @ManyToMany("Tag", "Directory")
  @JoinTable({
    name: "directory_tags",
    joinColumn: { name: "directory_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "tag_id", referencedColumnName: "id" },
  })
  tags: TagBase[];
}
