import { Entity, Column, Index, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from "typeorm";
import { Timestampable } from "src/common/interfaces/timestampable.interface";
import { IdentifiableModel } from "src/common/interfaces/Identifiable.interface";

@Entity("invalid_tokens")
export class InvalidToken implements IdentifiableModel, Timestampable {

  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;
  
  @Index("IDX_INVALID_TOKEN_HASH")
  @Column({
    name: "token",
    type: "varchar",
    length: 1024,
    nullable: false
  })
  token: string;

  @Column({
    name: "expires_at",
    type: "timestamp",
    nullable: false
  })
  expiresAt: Date;

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
