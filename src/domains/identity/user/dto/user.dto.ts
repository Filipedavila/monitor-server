import { Expose, Transform } from 'class-transformer';
import { RoleDTO } from '../../role/role.dto';
export class UserDTO {
  @Expose()
  id: number;  
  @Expose()
  username: string;
  @Expose()
  names: string;
  @Expose()
  email: string;
  @Expose()
  fullName: string;
  @Expose()
  createdAt: Date;
  @Expose()
  updatedAt: Date;
  @Expose()
  lastLogin: Date;
  @Transform(({ obj }) => obj.role?.slug ?? null)
  @Expose()
  role: RoleDTO;
  
}
