import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinTable,
  ManyToMany,
} from "typeorm";
import { AppsDirectory } from "src/apps-directory/apps-directory.entity";
import { Application } from "src/application/application.entity";

@Entity("AppsCategory")
export class AppsCategory {
  @PrimaryGeneratedColumn({
    type: "int",
  })
  AppsCategoryId: number;

  @Column({
    type: "int",
    nullable: true,
  })
  UserId: number;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
  })
  Name: string;

  @Column({
    type: "datetime",
    nullable: false,
  })
  Creation_Date: any;

  @ManyToMany((type) => AppsDirectory)
  @JoinTable()
  Directories: AppsDirectory[];

  @ManyToMany((type) => Application, (application) => application.Categories)
  @JoinTable({
    name: "AppsCategoryApplication",
    joinColumns: [{ name: "AppsCategoryId" }],
    inverseJoinColumns: [{ name: "ApplicationId" }],
  })
  Applications: Application[];
}
