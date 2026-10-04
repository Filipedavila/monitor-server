import { Expose } from "class-transformer";

export class RoleDTO {
  @Expose()
   displayName: string;
  @Expose()
   slug: string;
   @Expose()
   description: string;
}