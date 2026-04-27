import { AppsCategory } from "src/apps-category/apps-category.entity";
import { AppsEntity } from "src/apps-entity/apps-entity.entity";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
} from "typeorm";

@Entity("Application")
export class Application {
  @PrimaryGeneratedColumn({
    type: "int",
  })
  ApplicationId: number;

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
    type: "varchar",
    length: 255,
    nullable: false,
  })
  DownloadUrl: string;

  @Column({
    type: "varchar",
    length: 10,
    nullable: false,
  })
  OperatingSystem: string;

  @Column({
    type: "int",
    nullable: true,
  })
  Declaration: number;

  @Column({
    type: "datetime",
    nullable: true,
  })
  DeclarationUpdateDate: any;

  @Column({
    type: "int",
    nullable: true,
  })
  Stamp: number;

  @Column({
    type: "datetime",
    nullable: true,
  })
  StampUpdateDate: any;

  @Column({
    type: "datetime",
    nullable: false,
  })
  CreationDate: any;

  @ManyToMany((type) => AppsCategory, (category) => category.Applications)
  Categories: AppsCategory[];

  @ManyToMany((type) => AppsEntity)
  @JoinTable()
  Entities: AppsEntity[];
}
