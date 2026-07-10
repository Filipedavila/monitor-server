import { Team } from "src/domains/identity/team/team.entity";
import { Website } from "src/domains/inventory/website/website.entity";
import { 
  Entity, 
  Column, 
  CreateDateColumn, 
  ManyToOne, 
  JoinColumn, 
  PrimaryColumn,
  Index
} from "typeorm";


@Entity("team_websites")
@Index(["websiteId"])
export class TeamWebsites {


  @PrimaryColumn({ name: "team_id", type: "int", unsigned: true, nullable: false })
  teamId: number;

  @PrimaryColumn({ name: "website_id", type: "int", unsigned: true, nullable: false })
  websiteId: number;

  @ManyToOne(() => Team, { onDelete: "CASCADE" })
  @JoinColumn({ name: "team_id" })
  team: Team;

  @ManyToOne(() => Website, { onDelete: "CASCADE" })
  @JoinColumn({ name: "website_id" })
  website: Website;

  @CreateDateColumn({ name: "created_at", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ name: "created_by_id", type: "int", unsigned: true, nullable: true })
  createdById: number;
}