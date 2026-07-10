import { Auditable } from "src/common/interfaces/auditable.interface";
import { IdentifiableModel } from "src/common/interfaces/Identifiable.interface";
import { User } from "src/domains/identity/user/user.entity";
import { Entity, Column, JoinTable, ManyToMany, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from "typeorm";
import { Tag } from "../tag/tag.entity";

export const TAG_MATCHING_STRATEGIES = {'UNION': 'UNION', 'INTERSECTION': 'INTERSECTION'} as const;

export type TagMatchingStrategyType = typeof TAG_MATCHING_STRATEGIES[keyof typeof TAG_MATCHING_STRATEGIES];

@Entity("directories")
export class Directory implements IdentifiableModel, Auditable{
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;
    
  @Column({
    name: "name",
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
    name: "tag_matching_strategy",
    type: "enum",
    enum: ['UNION', 'INTERSECTION'],
    default: 'UNION',
  })
  tagMatchingStrategy: TagMatchingStrategyType;
  
  @ManyToMany(() => Tag)
  @JoinTable({
    name: "directory_tags",
    joinColumn: { name: "directory_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "tag_id", referencedColumnName: "id" },
  })
  tags: Tag[];

  @CreateDateColumn({
         name: "created_at",
         type: "timestamptz",
         default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;
     
  @UpdateDateColumn({
         name: "updated_at",
         type: "timestamptz",
         default: () => "CURRENT_TIMESTAMP",
         onUpdate: "CURRENT_TIMESTAMP",
  })
   updatedAt: Date;
       
  @Index()
  @Column({ name: "created_by_id", type: "int", unsigned: true, nullable: true }) 
  createdById: number;
     
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "created_by_id" })
  createdBy: User;
   
  @Index()
  @Column({ name: "updated_by_id", type: "int", unsigned: true, nullable: true })
  updatedById: number | null;
   
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "updated_by_id" })
  updatedBy: User |  null;
   
  
}
