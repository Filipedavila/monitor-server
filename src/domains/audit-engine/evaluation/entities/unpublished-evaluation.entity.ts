import { Entity, Column, CreateDateColumn, Index,  PrimaryColumn } from 'typeorm';
import { Evaluation } from './evaluation.entity';

@Entity('unpublished_evaluations')
@Index(['evaluationId'])
@Index(['createdAt'])
export class UnpublishedEvaluation {


  @PrimaryColumn({ name: 'evaluation_id', type: 'int'})
  evaluationId: number;

  @Column({ name: 'website_id', type: 'int' })
  websiteId: number;

  @Column({ name: 'directory_id', type: 'int', nullable: true })
  directoryId: number;

  @Column({ name: 'institution_id', type: 'int', nullable: true })
  institutionId: number;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

}