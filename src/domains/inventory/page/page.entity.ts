import { Website } from "../website/website.entity";
import {
  Entity,
  Column,
  ManyToMany,
  JoinTable,
  BeforeUpdate,
  BeforeInsert,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Role } from "../../identity/user/roles.entity";
import { createHash } from "crypto";
import { AuditableEntity } from "../../../common/entities/auditable.entity";

@Entity("pages")
export class Page extends AuditableEntity {
  @Column({
    type: "text",
    nullable: false,
  })
  url: string;

  @Index({ unique: true })
  @Column({
    type: "varchar",
    length: 64,
    nullable: false,
    charset: "ascii",
    collation: "ascii_general_ci",
  })
  url_hash: string;

  @ManyToMany(() => Role)
  @JoinTable({
    name: "page_visibility_roles",
    joinColumn: { name: "page_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "role_id", referencedColumnName: "id" },
  })
  allowedRoles: Role[];

  @ManyToOne(() => Website, (website) => website.page, { onDelete: "CASCADE" })
  @JoinColumn({ name: "website_id" }) 
  website: Website;

  @BeforeInsert()
  @BeforeUpdate()
  generateHash() {
    if (this.url) {
      this.url_hash = createHash("sha256").update(this.url).digest("hex");
    }
  }

  @Column({ default: false })
  inObservatory: boolean;

  @Column({ type: 'enum', enum: ['OFFICIAL', 'PRIVATE_STUDY'], default: 'OFFICIAL' })
  type: 'OFFICIAL' | 'PRIVATE_STUDY';
  
}
