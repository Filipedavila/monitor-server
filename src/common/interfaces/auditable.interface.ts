import { Timestampable } from "./timestampable.interface";
import { UserReference } from "./soft-deletable.interface";

export interface Auditable extends  Timestampable {
  createdById: number | null;
  createdBy: UserReference | null;
  updatedById: number | null;
  updatedBy: UserReference | null;
}