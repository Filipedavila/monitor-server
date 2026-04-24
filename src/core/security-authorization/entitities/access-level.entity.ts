import { Entity, Column, Index, PrimaryGeneratedColumn } from "typeorm";

export const AccessLevel = {
  // OWNER tem acesso total, incluindo gerenciamento de permissões
  OWNER: "OWNER",
  // EDITOR pode criar e modificar, mas não gerenciar permissões
  EDITOR: "EDITOR",
  // VIEWER tem acesso somente leitura
  VIEWER: "VIEWER",
} as const;

export type AccessLevelCode = (typeof AccessLevel)[keyof typeof AccessLevel];

@Entity("access_levels")
export class AccessLevelEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index("idx_access_level_type", { unique: true })
  @Column({
    name: "type",
    type: "varchar",
    length: 50,
    unique: true,
  })
  type: AccessLevelCode;

  @Column({ name: "description", type: "varchar", length: 255, nullable: true })
  description?: string;

  @Column({
    name: "weight",
    type: "int",
    unsigned: true,
    comment: "Higher value means higher privilege",
  })
  weight: number;
}
