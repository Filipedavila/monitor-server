import { IsEnum, IsNotEmpty, IsDate } from 'class-validator';
import { AuditStatus } from 'src/common/enums/audit-status.enum';
import { StampLevel } from '../enums/stamp-level.enum';

export class UpdateStampDto {
  @IsNotEmpty({ message: 'O nivel do Selo é obrigatório  .' })
  @IsEnum(StampLevel, { message: 'O nivel do selo fornecido é inválido.' })
  stampLevel: StampLevel;

  @IsDate({ message: 'A data da Selo é obrigatória' })
  dateStamp: Date;
}
