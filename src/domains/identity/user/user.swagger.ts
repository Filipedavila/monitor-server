import { applyDecorators, HttpCode } from "@nestjs/common";
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiBasicAuth, 
  ApiParam, 
  ApiBody 
} from "@nestjs/swagger";
import { User } from "./user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { DeleteUserDto } from "./dto/delete-user.dto";

export const UserDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("user"),
      ApiBasicAuth(),
      ApiResponse({ status: 403, description: "Forbidden" })
    ),

  changePassword: () =>
    applyDecorators(
      ApiOperation({ summary: "Change user password" }),
      ApiResponse({ status: 200, description: "The password was changed", type: Boolean }),
      HttpCode(200)
    ),

  create: () =>
    applyDecorators(
      ApiOperation({ summary: "Create user" }),
      ApiResponse({ status: 200, description: "A new user was created", type: Boolean }),
      HttpCode(200)
    ),

  update: () =>
    applyDecorators(
      ApiOperation({ summary: "Update user" }),
      ApiResponse({ status: 200, description: "The user was updated", type: Boolean }),
      HttpCode(200)
    ),

  delete: () =>
    applyDecorators(
      ApiOperation({ summary: "Delete user" }),
      ApiResponse({ status: 200, description: "The user was deleted", type: Boolean })
    ),

  getUser: () =>
    applyDecorators(
      ApiOperation({ summary: "Find user by id" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean })
    ),

  getUserInfo: () =>
    applyDecorators(
      ApiOperation({ summary: "Find user info by id" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  checkExists: () =>
    applyDecorators(
      ApiOperation({ summary: "Check if user exists by id" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  findAllAMS: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all users AMS" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  findAllMyMonitor: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all users MyMonitor" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  totalStudyMonitor: () =>
    applyDecorators(
      ApiOperation({ summary: "Find total users Study Monitor" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  totalMyMonitor: () =>
    applyDecorators(
      ApiOperation({ summary: "Find total users My Monitor" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  checkTagName: () =>
    applyDecorators(
      ApiOperation({ summary: "Check if tag name exists" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  findType: () =>
    applyDecorators(
      ApiOperation({ summary: "Find user type" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  findWebsites: () =>
    applyDecorators(
      ApiOperation({ summary: "Find websites by user" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  findTags: () =>
    applyDecorators(
      ApiOperation({ summary: "Find tags by user" }),
      ApiResponse({ status: 200, description: "Success", type: Boolean }),
      HttpCode(200)
    ),

  countSearch: () =>
    applyDecorators(
      ApiOperation({ summary: "Count users by search term" }),
      ApiResponse({ status: 200, description: "Success", type: Number }),
      HttpCode(200)
    ),

  findAllPaged: () =>
    applyDecorators(
      ApiOperation({ summary: "Find all users with pagination and search" }),
      ApiResponse({ status: 200, description: "Success", type: Array })
    ),
};