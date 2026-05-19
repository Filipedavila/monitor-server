import { Role } from "./roles.entity";
import { GovUser } from "../gov-user/entities/gov-user.entity";
import { Entity, Column, ManyToMany, JoinColumn, ManyToOne, OneToOne } from "typeorm";
import { AuditableEntity } from "../../../common/entities/auditable.entity";
import {DeletionMetadata} from "../../../common/entities/soft-deletable.entity";
import { Organization } from "../organization/organization.entity";

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

  @OneToOne(() => GovUser)
  @JoinColumn({ name: "gov_user_id" })
  govUser: GovUser;

@Column({ name: "gov_user_id", type: "int", unsigned: true, nullable: true })
  govUserId: number;
  

  @ManyToMany(() => Organization, (organization: Organization) => organization.users)
  organizations: Organization[];

  @Column(() => DeletionMetadata , { prefix: false })
  deletionMetadata: DeletionMetadata;
}
