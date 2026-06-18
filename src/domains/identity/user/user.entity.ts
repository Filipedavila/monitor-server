import { Role } from "../role/roles.entity";
import { Entity, Column, ManyToMany, JoinColumn, ManyToOne, OneToOne, JoinTable } from "typeorm";
import { AuditableEntity } from "../../../common/entities/auditable.entity";
import {DeletionMetadata} from "../../../common/entities/soft-deletable.entity";
import { Team } from "../team/team.entity";

@Entity("users")
export class User extends AuditableEntity {
  @ManyToOne(() => Role, { eager: true, nullable: false })
  @JoinColumn({ name: "role_id" })
  role: Role;
  
  @Column({ name: "role_id" , type: "int", unsigned: true, nullable: false })
  roleId: number;
  
  @Column({
    name: "username",
    type: "varchar",
    length: 150,
    unique: true,
    nullable: false,
  })
  username: string;

  @Column({
    name: "password",
    type: "varchar",
    length: 255,
    nullable: false,
    select: false,
  })
  password: string;

  @Column({
    name: "full_name",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  fullName?: string;

  @Column({
    name: "email",
    type: "varchar",
    length: 255,
    unique: true,
    nullable: false,
  })
  email: string;

  @Column({
    name: "last_login",
    type: "timestamp",
    nullable: true,
  })
  lastLogin?: Date;

  @Column({
    name: "unique_hash",
    type: "varchar",
    length: 255,
    nullable: false,
  })
  uniqueHash: string;
  
  
  @Column({
    name: "cc_number",
    type: "varchar",
    length: 30,
    unique: true,
    nullable: true,
  })
  ccNumber: string;
  
  @ManyToMany(() => Team, (team: Team) => team.users)
  teams: Team[];
  
  @Column(() => DeletionMetadata , { prefix: false })
  deletionMetadata: DeletionMetadata;
}
