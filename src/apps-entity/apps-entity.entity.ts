import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { Application } from "src/application/application.entity";

@Entity("AppsEntity")
export class AppsEntity {
  @PrimaryGeneratedColumn({
    type: "int",
  })
  AppsEntityId: number;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
    unique: true,
  })
  Short_Name: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
    unique: true,
  })
  Long_Name: string;

  @Column({
    type: "datetime",
    nullable: false,
  })
  Creation_Date: any;

  @ManyToMany((type) => Application)
  @JoinTable()
  Applications: Application[];
}
