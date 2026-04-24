import {
  Column,
  Entity,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
  OneToOne,
} from "typeorm";
@Entity({ name: "gov_users" })
export class GovUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 100, nullable: false, unique: true })
  name: string;

  @Column({ type: "varchar", nullable: false, unique: true })
  ccNumber: string;
  /*
  @ManyToMany("User", (user: User) => user.govUsers)
  @JoinTable({
    name: "user_gov_user",
    inverseJoinColumn: { name: "user_id" },
    joinColumn: { name: "gov_user_id" },
  })
  entities: User[];
  */


  @Column({
    type: "datetime",
    nullable: false,
  })
  registerDate: Date;

  @Column({
    type: "datetime",
    nullable: false,
  })
  lastLogin: Date;
}
