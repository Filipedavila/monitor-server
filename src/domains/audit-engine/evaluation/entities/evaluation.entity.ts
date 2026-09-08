import { Auditable } from 'src/common/interfaces/auditable.interface';
import { IdentifiableModel } from 'src/common/interfaces/Identifiable.interface';
import { User } from 'src/domains/identity/user/user.entity';
import {
  Entity,
  Column,
  Index,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  PrimaryColumn,
  OneToMany,
} from 'typeorm';
import { Page } from 'src/domains/inventory/page/page.entity';

export enum EvaluationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum PublishStatus {
  PENDING = 'pending',
  PUBLISHED = 'published',
  FAILED = 'failed',
}

@Entity('evaluations')
@Index('idx_evaluations_created_at', ['createdAt'])
export class Evaluation implements IdentifiableModel, Auditable {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @Column({
    name: 'page_id',
    type: 'int',
    nullable: false,
  })
  pageId: number;

  @ManyToOne(() => Page, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'page_id' })
  page: Page;

  @Column({
    name: 'page_title',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  pageTitle: string;

  @Column({
    name: 'score',
    type: 'decimal',
    precision: 4,
    scale: 1,
    nullable: true,
  })
  score: string;

  @Column({
    type: 'int',
    nullable: true,
  })
  A: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  AA: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  AAA: number;

  @Column({
    name: 'tag_count',
    type: 'int',
    nullable: true,
  })
  tagCount: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: EvaluationStatus,
    default: EvaluationStatus.PENDING,
  })
  status: EvaluationStatus;

  @Column({
    name: 'publish_status',
    type: 'enum',
    enum: PublishStatus,
    default: PublishStatus.PENDING,
  })
  publishStatus: PublishStatus;

  @Column({
    name: 'evaluation_date',
    type: 'timestamptz',
    nullable: true,
  })
  evaluationDate: Date;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Index()
  @Column({ name: 'created_by_id', type: 'int', unsigned: true, nullable: true })
  createdById: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ name: 'updated_by_id', type: 'int', unsigned: true, nullable: true })
  updatedById: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by_id' })
  updatedBy: User | null;
}
