import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  UseGuards,
  HttpCode,
  ParseIntPipe,
} from "@nestjs/common";
import { GovUserService } from "./gov-user.service";
import { CreateGovUserDto } from "./dto/create-gov-user.dto";
import { UpdateGovUserDto } from "./dto/update-gov-user.dto";
import { LoggingInterceptor } from "src/core/log/log.interceptor";
import { RolesGuard } from "src/core/authorization/guards/roles.guard";
import { JwtAuthGuard } from "src/core/authentication/guards/jwt-auth.guard";
import { Roles } from "src/core/authorization/decorators/roles.decorator";

@Controller("gov-user")
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(LoggingInterceptor)
export class GovUserController {
  constructor(private readonly govUserService: GovUserService) {}

  @Roles("admin")
  @Post("create")
  @HttpCode(200)
  async create(@Body() createGovUserDto: CreateGovUserDto) {
    return await this.govUserService.create(createGovUserDto);
  }

  @Roles("admin")
  @Get("all")
  @HttpCode(200)
  async findAll() {
    return await this.govUserService.findAll();
  }

  @Roles("admin")
  @Get("exists/:cc")
  @HttpCode(200)
  async exists(@Param("cc") cc: string) {
    return await this.govUserService.checkIfExists(cc);
  }

  @Roles("admin")
  @Get(":id")
  @HttpCode(200)
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return await this.govUserService.findOne(id);
  }

  @Roles("admin")
  @Post("update")
  @HttpCode(200)
  async update(@Body() updateGovUserDto: UpdateGovUserDto) {
    return await this.govUserService.update(updateGovUserDto);
  }

  @Roles("admin")
  @Post("delete")
  @HttpCode(200)
  async remove(@Body() updateGovUserDto: UpdateGovUserDto) {
    return await this.govUserService.remove(updateGovUserDto.id);
  }


  @Roles("admin")
  @Get("total")
  @HttpCode(200)
  async getGovUserTotal(): Promise<any> {
    return await this.govUserService.findTotal();
  }
  
  @Roles("admin")
  @Get("all/count/:search")
  @HttpCode(200)
  async getAdminGovUserCount(@Param("search") search: string): Promise<any> {
    return await this.govUserService.adminCount(
      decodeURIComponent(search.substring(7)),
    );
  }

  // TODO : Implementa pagination
  @Roles("admin")
  @Get("all/:size/:page/:sort/:direction/:search")
  @HttpCode(200)
  async getAllGovUsers(
    @Param("size") size: string,
    @Param("page") page: string,
    @Param("sort") sort: string,
    @Param("direction") direction: string,
    @Param("search") search: string,
  ): Promise<any> {
    return await this.govUserService.findAll(
      parseInt(size),
      parseInt(page),
      sort.substring(5),
      direction.substring(10),
      decodeURIComponent(search.substring(7)),
    );
  }
}
