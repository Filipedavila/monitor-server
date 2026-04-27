import { IsNotEmpty } from "class-validator";

export class UpdateApplicationDTO {
  @IsNotEmpty()
  applicationId: number;

  userId: number;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  downloadUrl: string;

  @IsNotEmpty()
  operatingSystem: string;

  declaration: number;

  declarationUpdateDate: any;

  stamp: number;

  stampUpdateDate: any;

  entities: number[];

  categories: number[];

  defaultEntities: number[];

  defaultCategories: number[];
}
