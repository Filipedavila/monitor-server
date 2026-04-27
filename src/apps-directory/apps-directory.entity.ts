import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, JoinTable, ManyToMany } from "typeorm";

import { AppsCategory } from "src/apps-category/apps-category.entity";

@Entity("AppsDirectory")
export class AppsDirectory {
  @PrimaryGeneratedColumn({
    type: "int",
  })
  AppsDirectoryId: number;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
  })
  Name: string;

  @Column({
    type: "tinyint",
    width: 1,
    nullable: false,
  })
  Method: number;

  @Column({
    type: "datetime",
    nullable: false,
  })
  Creation_Date: any;

  @ManyToMany((type) => AppsCategory)
  @JoinTable({
    name: "AppsDirectoryAppsCategory",
    joinColumns: [{ name: "AppsDirectoryId" }],
    inverseJoinColumns: [{ name: "AppsCategoryId" }],
  })
  Categories: AppsCategory[];
}
