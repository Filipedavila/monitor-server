import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsNumber } from "class-validator";

export class CrawlerDelete {
  @ApiProperty({
    type: [Number],
    description: "Lista de IDs de CrawlWebsites a eliminar",
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayMinSize(1, {
    message: "Deves fornecer pelo menos um ID para eliminar.",
  })
  @IsNumber({}, { each: true, message: "Cada ID deve ser um número válido." })
  @Type(() => Number)
  ids: number[];
}
