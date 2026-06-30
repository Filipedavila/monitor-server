import { Entity, Column, UpdateDateColumn, CreateDateColumn, PrimaryGeneratedColumn } from "typeorm";
import { RoleSlug } from "src/core/authentication/interfaces/types";
import { Timestampable } from "src/common/interfaces/timestampable.interface";
import { IdentifiableModel } from "src/common/interfaces/Identifiable.interface";

@Entity("roles")
export class Role  implements IdentifiableModel, Timestampable {
  
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;
    
  @Column({
    name: "slug",
    type: "varchar",
    length: 50,
    unique: true,
  })
  slug: string;

  @Column({
    name: "display_name",
    type: "varchar",
    length: 100,
  })
  displayName: string;

  @Column({
    name: "description",
    type: "text",
    nullable: true,
  })
  description?: string;

  
  @CreateDateColumn({
        name: "created_at",
        type: "timestamptz",
        default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;
    
  @UpdateDateColumn({
        name: "updated_at",
        type: "timestamptz",
        default: () => "CURRENT_TIMESTAMP",
        onUpdate: "CURRENT_TIMESTAMP",
    })
  updatedAt: Date;
    
}
