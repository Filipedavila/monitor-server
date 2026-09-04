import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber } from "class-validator";

export class CrawlerWebsiteDTO {
  @ApiProperty({
    description: "O ID do crawler para filtrar os resultados",
    example: 123,
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  crawlerId: number;
}
