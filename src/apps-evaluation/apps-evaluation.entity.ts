import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("AppsEvaluation")
export class AppsEvaluation {
  @PrimaryGeneratedColumn({
    type: "int",
  })
  AppsEvaluationId: number;
  
  @Column({
    type: "int",
    nullable: false,
  })
  AppId: number;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  Title: string;

  @Column({
    type: "varchar",
    length: 2,
    nullable: false,
  })
  Show_To: string;

  @Column({
    type: "int",
    nullable: false,
  })
  Conformance: number;

  @Column({
    type: "text",
    nullable: false,
  })
  Result: string;

  @Column({
    type: "datetime",
    nullable: false,
  })
  Date: Date;
}
