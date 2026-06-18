import { AuditableEntity } from "@common/entities/auditable.entity";
import { Entity, Column, Index } from "typeorm";

export enum EvaluationContext {
  ADMIN_AMS = 'AMS',        
  MY_MONITOR = 'MONITOR',   
  STUDY_MONITOR = 'STUDY'    
}
export enum SubjectType {
  ROLE = 1,
  TEAM = 2,
  USER = 3,
}

@Entity("evaluations")
@Index('idx_pagination_visibility', [
  'pageId', 
  'isVisiblePublic', 
  'isVisibleOrganizations', 
  'ownerSubjectId', 
  'ownerType'
])
export class Evaluation extends AuditableEntity {

  @Column({
    name: "page_id",
    type: "int",
    nullable: false,
  })
  pageId: number;

  @Column({
    name: "page_title",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  pageTitle: string;

  @Column({
    name: "score",
    type: "decimal",
    precision: 4,
    scale: 1,
    nullable: true,
  })
  score: string;

  @Column({
    type: "int",
    nullable: true,
  })
  A: number;

  @Column({
    type: "int",
    nullable: true,
  })
  AA: number;

  @Column({
    type: "int",
    nullable: true,
  })
  AAA: number;

  @Column({ name: "context", type: 'enum', enum: EvaluationContext })
  context: EvaluationContext;

  @Column({
    name: "tag_count",
    type: "int",
    nullable: true,
  })
  tagCount: number;

  @Column({ name: "is_visible_organizations", type: "boolean", default: false })
  isVisibleOrganizations: boolean;

  @Column({ name: "is_visible_public", type: "boolean", default: false })
  isVisiblePublic: boolean;

  @Column({ name: "owner_subject_id", type: "int", unsigned: true})
  ownerSubjectId: number;

@Column({
  name: 'owner_type',
  type: 'enum',
  enum: SubjectType,
})
ownerType: SubjectType;

}
