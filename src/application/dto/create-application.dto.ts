import { IsNotEmpty } from "class-validator";

export class CreateApplicationDTO {
  userId: number;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  downloadUrl: string;

  @IsNotEmpty()
  operatingSystem: string;

  declaration: number;

  declarationUpdateDate: string;

  stamp: number;

  stampUpdateDate: string;

  appsEntities: string[];

  appsCategories: string[];
}
