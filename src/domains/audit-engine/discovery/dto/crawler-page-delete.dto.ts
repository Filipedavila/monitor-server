import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsString,
  IsUrl,
} from "class-validator";

export class CrawlerPageDeleteDTO {
  @ApiProperty({
    type: Number,
    description: "ID do Crawler do qual as páginas serão eliminadas",
    example: 1,
  })
  @IsNumber({}, { message: "O ID do Crawler deve ser um número válido." })
  @Type(() => Number)
  crawlerId: number;

  @ApiProperty({
    type: [String],
    description: "Lista de URIs das páginas a serem eliminadas",
    example: ["http://example.com/page1", "http://example.com/page2"],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, {
    message: "Deves fornecer pelo menos uma URI para eliminar.",
  })
  @IsUrl(
    {
      protocols: ["http", "https"],
      require_protocol: true,
    },
    {
      each: true,
      message: "Cada URI deve ser um URL válido (ex: https://...)",
    },
  )
  uris: string[];
}
