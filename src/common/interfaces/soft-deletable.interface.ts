
export interface UserReference {
  id: number;
  username: string;
}
export interface SoftDeletable {
  deletedAt: Date | null;
  deletedById: number | null;
  deletedBy: UserReference | null;
}