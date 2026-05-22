import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { User } from "./user.entity";
import { plainToInstance } from 'class-transformer';
import {
  comparePasswordHash,
  createRandomUniqueHash,
  generatePasswordHash,
} from "../../../common/security";
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { UserQueryDTO } from "./dto/request/user-request.dto";
import { SecurityContext } from "src/domains/audit-engine/evaluation/controllers/evaluation.controller";
import { UserDTO } from "./dto/user.dto";
import { UserRepository } from "./repositories/user.repository";
import { FgaService } from "src/core/authorization/fga.service";
import { FGA_RESOURCE } from "src/core/authorization/types/fga.types";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { RoleService } from "../role/role.service";
import { UpdateMeDTO } from "./dto/update-user-me.dto";
import { Not } from "typeorm";

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
    if (dto.names !== undefined) user.fullName = dto.names;
    if (dto.email !== undefined) user.email = dto.email;
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

  if (dto.names !== undefined) user.fullName = dto.names;
  if (dto.email !== undefined) user.email = dto.email;
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
    const result = await this.userRepository.getOrmRepository().softDelete({ id: userId });
    // TODO implement deletion in OpenFGA ?!
    // TODO implement OUTBOX Pattern
      if(result.affected === 0) {
      throw new NotFoundException();
     } 
     // TODO : Handle cascade deletion of related entities and permissions in OpenFGA
     // or create event for this action to decouple from UserService
   /* const related = await this.fgaService.findObjectsRelated(userId, FGA_RESOURCE.ORGANIZATION, "admin");
    if(related.related.length) {
      for(const orgId of related.related) {
        await this.fgaService.createRelationship({
          object: `organization:${orgId}`,
          relation: "admin",
          user: `user:pending`
        });
      }
    }
    await this.fgaService.purgeAllTuplesForUser(userId);
     */
  }

  public async getUsers(securityContext: SecurityContext, query:UserQueryDTO ): Promise<{ data: UserDTO[]; count: number }> {
         return await this.userRepository.findManyCustom<UserDTO>({ filters: query.filters, sortings: query.sorts, pagination: query.pagination, securityContext },
           ["id", "username", "fullName", "email","createdAt", "updatedAt" ,  "lastLogin"], { role: [{ field: "displayName"}, { field: "description" }] });
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
        if(userCreateDto.ccNumber) {
          const existingUser = await this.userRepository.getOrmRepository().findOne({ where: { ccNumber: userCreateDto.ccNumber } });
          if (existingUser) {
            throw new BadRequestException("A user with the provided citizen card number already exists.");
          }
        }
        const user = new User();
        user.username = userCreateDto.username;
        user.password = await generatePasswordHash(userCreateDto.password);
        user.fullName = userCreateDto.names;
        user.email = userCreateDto.email;
        user.ccNumber = userCreateDto.ccNumber ?? null;
        user.roleId = this.roleService.getRoleIdBySlug(userCreateDto.role as RoleSlug);
        user.uniqueHash = createRandomUniqueHash();
        user.createdById = securityContext.id;
        await this.userRepository.getOrmRepository().save(user);

        const createdUser = await this.userRepository.getOrmRepository().findOneOrFail({ where: { id: user.id } });
        return plainToInstance(UserDTO, createdUser, { excludeExtraneousValues: true });
      
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
      ...(dto.email ? [{ email: dto.email, id: Not(userId) }] : []),
      ...(dto.ccNumber ? [{ ccNumber: dto.ccNumber, id: Not(userId) }] : [])
    ]
  });

  if (conflict && conflict.id !== userId) {
    const field = conflict.email === dto.email ? "email" : "citizen card number";
    throw new BadRequestException(`A user with the provided ${field} already exists.`);
  }
}


}
