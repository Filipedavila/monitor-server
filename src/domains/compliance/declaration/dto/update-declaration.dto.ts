import { IsEnum, IsNotEmpty, IsDate } from "class-validator";
import { AuditStatus } from "src/common/enums/audit-status.enum";

export class UpdateDeclarationDto {
  @IsNotEmpty({ message: "O estado de auditoria é obrigatório." })
  @IsEnum(AuditStatus, { message: "O estado de auditoria fornecido é inválido." })
  status: AuditStatus;

  @IsDate({message: "A data da declaração é obrigatória"})
  dateDeclaration:Date;

}