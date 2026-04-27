import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("AppsObservatory")
export class AppsObservatory {
  @PrimaryGeneratedColumn({
    type: "int",
  })
  AppsObservatoryId: number;

  @Column({
    type: "text",
    nullable: false,
  })
  Global_Statistics: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
  })
  Type: string;

  @Column({
    type: "datetime",
    nullable: false,
  })
  Creation_Date: Date;
}
