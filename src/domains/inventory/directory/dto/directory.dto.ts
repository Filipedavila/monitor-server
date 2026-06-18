import { Expose } from "class-transformer";
import { TagMatchingStrategyType } from "../directory.entity";
export class DirectoryDTO {
  @Expose()
  id: number;

  @Expose()
  name: string;
  @Expose()
  showInObservatory: boolean;

  @Expose()
  tagMatchingStrategy: TagMatchingStrategyType;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}