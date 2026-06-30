import { IdentifiableModel } from "src/common/interfaces/Identifiable.interface";
import { User } from "src/domains/identity/user/user.entity";
import { Website } from "src/domains/inventory/website/website.entity";
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  Index, 
  ManyToOne, 
  JoinColumn 
} from "typeorm";


@Entity("users_websites")
@Index(["userId", "websiteId"], { unique: true })
export class UserWebsite implements IdentifiableModel {

  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @Column({ name: "user_id", type: "int", unsigned: true, nullable: false })
  userId: number;

  @Column({ name: "website_id", type: "int", unsigned: true, nullable: false })
  websiteId: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Website, { onDelete: "CASCADE" })
  @JoinColumn({ name: "website_id" })
  website: Website;

  @CreateDateColumn({ name: "created_at", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ name: "created_by_id", type: "int", unsigned: true, nullable: true })
  createdById: number;
}