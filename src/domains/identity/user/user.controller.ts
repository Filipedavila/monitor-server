import {
  Controller, InternalServerErrorException, Post, Get, Request, Param, UseGuards, UnauthorizedException, UseInterceptors, Body, HttpCode,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { UserService } from "./user.service";
import { User } from "./user.entity";
import { generatePasswordHash, createRandomUniqueHash } from "../../../common/security";
import { LoggingInterceptor } from "src/core/log/log.interceptor";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { DeleteUserDto } from "./dto/delete-user.dto";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { Roles } from "src/core/authorization/decorators/roles.decorator";
import { RoleService } from "./role.service";
import { RoleSlug } from "src/core/authentication/interfaces/types";
import { UserDocs } from "./user.swagger";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";

@UserDocs.controller()
@Controller("user")
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(LoggingInterceptor)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService
  ) {}

  @UserDocs.changePassword()
  @Roles("admin", "monitor", "study")
  @Post("changePassword")
  async changeUserPassword(@Request() req: any): Promise<any> {
    if (!this.passwordValidator(req.body.newPassword)) {
      throw new InternalServerErrorException();
    }
    const password = req.body.password;
    const newPassword = req.body.newPassword;
    const confirmNewPassword = req.body.confirmPassword;
    if (newPassword !== confirmNewPassword) {
      throw new UnauthorizedException();
    }
    return {
      success: !!(await this.userService.changePassword(req.user.userId, password, newPassword)),
    };
  }

  @UserDocs.create()
  @Roles("admin")
  @Post("create")
  async createUser(@Body() createUserDto: CreateUserDto): Promise<any> {
    if (!this.passwordValidator(createUserDto.password)) {
      throw new InternalServerErrorException();
    }
    const user = new User();
    user.username = createUserDto.username;
    user.password = await generatePasswordHash(createUserDto.password);
    user.fullName = createUserDto.names;
    user.email = createUserDto.emails;
    user.roleId = this.roleService.getRoleIdBySlug(createUserDto.type as RoleSlug);
    user.uniqueHash = createRandomUniqueHash();

    const tags = createUserDto.tags;
    const websites = createUserDto.websites;
    const transfer = !!createUserDto.transfer;

    const createSuccess = await this.userService.createOne(user, tags, websites, transfer);
    if (!createSuccess) {
      throw new InternalServerErrorException();
    }
    return true;
  }

  @UserDocs.update()
  @Roles("admin")
  @Post("update")
  async updateUser(@Body() updateUserDto: UpdateUserDto): Promise<any> {
    const userId = updateUserDto.userId;
    const password = updateUserDto.password;
    const confirmPassword = updateUserDto.confirmPassword;
    if (password && confirmPassword && !this.passwordValidator(password)) {
      throw new InternalServerErrorException();
    }
    if (password !== confirmPassword) {
      return false;
    }
    const names = updateUserDto.names;
    const emails = updateUserDto.emails;
    const app = updateUserDto.app;
    const websites = this.convertToNumberArray(updateUserDto.websites);
    const defaultWebsites = this.convertToNumberArray(updateUserDto.defaultWebsites);
    const transfer = !!updateUserDto.transfer;

    const updateSuccess = await this.userService.update(userId, password, names, emails, app, defaultWebsites, websites, transfer);
    if (!updateSuccess) {
      throw new InternalServerErrorException();
    }
    return true;
  }

  @UserDocs.delete()
  @Roles("admin")
  @Post("delete")
  async deleteUser(@Body() deleteUserDto: DeleteUserDto): Promise<any> {
    const userId = deleteUserDto.userId;
    const app = deleteUserDto.app;
    const deleteSuccess = await this.userService.delete(userId, app);
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }
    return true;
  }

  @UserDocs.getUser()
  @Roles("admin")
  @Get("get/:id")
  getUser(@Param("id") id: string): Promise<User | null> {
    return this.userService.findById(id);
  }

  @UserDocs.getUserInfo()
  @Roles("admin")
  @Get("info/:userId")
  async getUserInfo(@Param("userId") userId: number): Promise<User> {
    return await this.userService.findInfo(userId);
  }

  @UserDocs.checkExists()
  @Get("exists/:username")
  async checkIfUsernameExists(@Param("username") username: string): Promise<boolean> {
    return !!(await this.userService.findByUsername(username));
  }

  @UserDocs.findAllAMS()
  @Roles("admin")
  @Get("all")
  async getAllNonAdminUsers(): Promise<any> {
    return await this.userService.findAll();
  }

  @UserDocs.findAllMyMonitor()
  @Roles("admin")
  @Get("myMonitor")
  async getAllMyMonitorUsers(): Promise<any> {
    return await this.userService.findAllFromMyMonitor();
  }

  @UserDocs.totalStudyMonitor()
  @Roles("admin")
  @Get("studyMonitor/total")
  async getNumberOfStudyMonitorUsers(): Promise<any> {
    return await this.userService.findNumberOfStudyMonitor();
  }

  @UserDocs.totalMyMonitor()
  @Roles("admin")
  @Get("myMonitor/total")
  async getNumberOfMyMonitorUsers(): Promise<any> {
    return await this.userService.findNumberOfMyMonitor();
  }

  @UserDocs.checkTagName()
  @Roles("study")
  @Get("tag/nameExists/:name")
  async checkIfUserTagNameExists(@Request() req: any, @Param("name") name: string): Promise<any> {
    if (name) {
      return !!(await this.userService.findStudyMonitorUserTagByName(req.user.userId, name));
    } else {
      return false;
    }
  }

  @UserDocs.findType()
  @Roles("admin")
  @Get("type/:user")
  async getUserType(@Param("user") user: string): Promise<any> {
    if (user) {
      return await this.userService.findType(user);
    } else {
      return null;
    }
  }

  @UserDocs.findWebsites()
  @Roles("admin")
  @Get("websites/:user")
  async getListOfUserWebsites(@Param("user") user: string): Promise<any> {
    if (user) {
      return await this.userService.findAllWebsites(user);
    } else {
      throw new InternalServerErrorException();
    }
  }

  @UserDocs.findTags()
  @Roles("admin")
  @Get("tags/:user")
  async getListOfUserTags(@Param("user") user: string): Promise<any> {
    if (user) {
      return await this.userService.findAllTags(user);
    } else {
      throw new InternalServerErrorException();
    }
  }

  @UserDocs.countSearch()
  @Roles("admin")
  @Get("all/count/:search")
  async getAdminUserCount(@Param("search") search: string): Promise<any> {
    return await this.userService.adminCount(decodeURIComponent(search.substring(7)));
  }

  @UserDocs.findAllPaged()
  @Roles("admin")
  @Get("all/:size/:page/:sort/:direction/:search")
  async getAllUsers(
    @Param("size") size: string,
    @Param("page") page: string,
    @Param("sort") sort: string,
    @Param("direction") direction: string,
    @Param("search") search: string,
  ): Promise<any> {
    return await this.userService.findAll(
      parseInt(size),
      parseInt(page),
      sort.substring(5),
      direction.substring(10),
      decodeURIComponent(search.substring(7)),
    );
  }

  private passwordValidator(password: string): boolean {
    const isShort = password.length < 8 || password.length === 0;
    const hasUpperCase = password.toLowerCase() !== password;
    const hasLowerCase = password.toUpperCase() !== password;
    const specialFormat = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    const hasSpecial = specialFormat.test(password);
    const numberFormat = /\d/g;
    const hasNumber = numberFormat.test(password);
    return !(isShort || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial);
  }

  private convertToNumberArray(str: any): number[] {
    if (typeof str === "string") {
      str = str.substring(1, str.length - 1);
      return str.split(",").map((x) => +x);
    } else {
      return str;
    }
  }
}