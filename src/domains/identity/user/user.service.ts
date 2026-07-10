import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { User } from "./user.entity";
import { plainToInstance } from 'class-transformer';
import {
  comparePasswordHash,
  createRandomUniqueHash,
  generatePasswordHash,
} from "../../../common/security";
import { AuthenticatedUser, RoleSlug, SecurityContext } from "src/core/authentication/interfaces/types";
import { UserQueryDTO } from "./dto/request/user-request.dto";
import { UserDTO } from "./dto/user.dto";
import { UserRepository } from "./repositories/user.repository";
import { FgaService } from "src/core/authorization/fga.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { RoleService } from "../role/role.service";
import { UpdateMeDTO } from "./dto/update-user-me.dto";
import { Not } from "typeorm";
import { FieldConflictException } from "src/common/exceptions/conflict.exception";

interface UniqueUserCriteria {
  ccNumber?: string;
  username: string;
}
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository :UserRepository,
    private readonly fgaService: FgaService,
    private readonly roleService: RoleService
  ) {}

  async findUserByGovCC(ccNumber: string): Promise<User> {
    return await this.userRepository.getOrmRepository().findOneOrFail( { where: { ccNumber: ccNumber } } );
  }
  
  async changeUserPassword(
      userId: number,
      password: string,
      newPassword: string,
    ): Promise<boolean> {

      if (!password || !newPassword) {
        throw new BadRequestException("Both current password and new password are required.");
      }

      const user = await this.userRepository.getOrmRepository()
        .createQueryBuilder("user")
        .addSelect("user.password") 
        .where("user.id = :userId", { userId })
        .getOne();

      if (!user) {
        throw new UnauthorizedException();
      }

      const isPasswordValid = await comparePasswordHash(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException("The current password provided is incorrect.");
      }

      const newPasswordHash = await generatePasswordHash(newPassword);

      const updateResult = await this.userRepository.getOrmRepository().update(
        { id: userId },
        { password: newPasswordHash },
      );

      if (updateResult.affected === 0) {
        throw new UnauthorizedException();
      }

      return true;
    }

  async updateMe(
     userId: number,
     dto: UpdateMeDTO
   ): Promise<UserDTO> {

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }  
    if(dto.newPassword) {
      await this.changeUserPassword(userId, dto.currentPassword, dto.newPassword);
    }
    const updatedUser = await this.userRepository.getOrmRepository().save(user);
    return plainToInstance(UserDTO, updatedUser, { excludeExtraneousValues: true });
  }  
    
async updateUser(userId: number, dto: UpdateUserDto): Promise<UserDTO> {
  const user = await this.userRepository.findById(userId);
  if (!user) {
    throw new NotFoundException("User not found.");
  }

  if (dto.role) this.handleRoleUpdate(user, dto.role);
  await this.validateUniqueness(userId, dto);

  if (dto.ccNumber !== undefined) user.ccNumber = dto.ccNumber;

  const savedUpdate = await this.userRepository.getOrmRepository().save(user);
  if (dto.role) {
    savedUpdate.role = {
      id: savedUpdate.roleId,
      slug: dto.role
    } as any;
  }
  
    return plainToInstance(UserDTO, savedUpdate, { excludeExtraneousValues: true });
}

  async delete(userId: number): Promise<void> { 
    await this.userRepository.deleteUser(userId);

  }

  public async getUsers(securityContext: SecurityContext, query:UserQueryDTO ): Promise<{ data: UserDTO[]; meta: { totalItems: number; currentPage: number; totalPages: number; itemsPerPage: number } }> {
         return await this.userRepository.findManyCustom<UserDTO>({ filters: query.filters, sortings: query.sorts, pagination: query.pagination, securityContext },
           ["id", "username", "createdAt", "updatedAt" ,  "lastLogin"], { role: [{ field: "displayName"}, { field: "description" }] });
    }
  

  async findAllFromMyMonitor(): Promise<User[]> {
    return this.userRepository.getOrmRepository().find({
      select: ["id", "username", "role", "createdAt", "lastLogin"],
      where: { role: { slug: RoleSlug.MONITOR } },
      relations: ["role"],
    });
  }

  async findById(id: number): Promise<User> {
    return this.userRepository.getOrmRepository().findOneOrFail({ where: { id: id } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.getOrmRepository().findOne({ where: { username: username } });
  }

  
  async createUser(
    securityContext: AuthenticatedUser,
    userCreateDto: CreateUserDto
  ): Promise<UserDTO> {
      
        const user = new User();
        user.username = userCreateDto.username;
        user.password = await generatePasswordHash(userCreateDto.password);
        
        user.ccNumber = userCreateDto.ccNumber ?? null;
        user.roleId = this.roleService.getRoleIdBySlug(userCreateDto.role as RoleSlug);
        user.uniqueHash = createRandomUniqueHash();
        user.createdById = securityContext.id;
        const savedUser = await this.userRepository.createUser(user, userCreateDto.role, userCreateDto.permission);
       
        return plainToInstance(UserDTO, savedUser, { excludeExtraneousValues: true });     
  }
  async restoreUser(id: number): Promise<void> {
    const result = await this.userRepository.getOrmRepository().restore({ id: id });
    if(result.affected === 0) {
      throw new NotFoundException();
     } 
  }
  private handleRoleUpdate(user: User, roleSlug: string): void {
  const roleId = this.roleService.getRoleIdBySlug(roleSlug as RoleSlug); 
  if (!roleId) {
    throw new BadRequestException("The provided role is not valid in the system.");
  }
  delete (user as any).role;
  user.roleId = roleId;
}

private async validateUniqueness(userId: number, dto: UpdateUserDto): Promise<void> {
  const repo = this.userRepository.getOrmRepository();

  if (!dto.email && !dto.ccNumber) return;

  const conflict = await repo.findOne({
    where: [
      ...(dto.ccNumber ? [{ ccNumber: dto.ccNumber, id: Not(userId) }] : [])
    ]
  });

  if (conflict && conflict.id !== userId) {
    const field = conflict.ccNumber === dto.ccNumber ? "citizen card number" : "username";
    throw new BadRequestException(`A user with the provided ${field} already exists.`);
  }
}

private async validateUniqueUserConflicts(
  userData: CreateUserDto, 
  criteria: UniqueUserCriteria
): Promise<void> {

  const conflictingUsers = await this.userRepository.findByUniqueCriteria({
            ccNumber: userData.ccNumber,
            username: userData.username
        });
  if (!conflictingUsers || conflictingUsers.length === 0) {
    return;
  }

  const conflicts: Record<string, string> = {};

  const hasCcConflict = criteria.ccNumber && conflictingUsers.some(u => u.ccNumber === criteria.ccNumber);
  const hasUsernameConflict = conflictingUsers.some(u => u.username === criteria.username);

  if (hasCcConflict) {
    conflicts['ccNumber'] = "A user with the provided citizen card number already exists.";
  }

  if (hasUsernameConflict) {
    conflicts['username'] = "A user with the provided username already exists.";
  }

  if (Object.keys(conflicts).length > 0) {
        throw new FieldConflictException(conflicts);
  }
}
}


