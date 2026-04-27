import { PartialType } from "@nestjs/mapped-types";
import { CreateAppsCategoryDTO } from "./create-apps-category.dto";

export class UpdateAppsCategoryDTO extends PartialType(CreateAppsCategoryDTO) {
  defaultDirectories: number[];
  defaultApplications: number[];
  appsCategoryId: number;
}
