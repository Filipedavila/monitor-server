import { Team } from "src/domains/identity/team/team.entity";
import { User } from "src/domains/identity/user/user.entity";
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  Index, 
  ManyToOne, 
  JoinColumn 
} from "typeorm";


@Entity("team_member")
@Index(["teamId", "userId"], { unique: true }) 
export class TeamMembers {

  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @Column({ name: "team_id", type: "int", unsigned: true, nullable: false })
  teamId: number;

  @Column({ name: "user_id", type: "int", unsigned: true, nullable: false })
  userId: number;

  @ManyToOne(() => Team, { onDelete: "CASCADE" })
  @JoinColumn({ name: "team_id" })
  team: Team;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @CreateDateColumn({ name: "created_at", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ name: "created_by_id", type: "int", unsigned: true, nullable: true })
  createdById: number;
}