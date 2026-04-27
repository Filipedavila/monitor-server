import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("Apps_Invalid_Token")
export class AppsInvalidToken {
  @PrimaryGeneratedColumn({
    type: "int",
  })
  AppsTokenId: number;

  @Column({
    type: "text",
    nullable: false,
  })
  AppsToken: string;

  @Column({
    type: "datetime",
    nullable: false,
  })
  Expiration_Date: any;
}
