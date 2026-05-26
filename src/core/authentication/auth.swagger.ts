import { applyDecorators } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBody, ApiExtraModels, getSchemaPath } from "@nestjs/swagger";

class LoginResponseDto {
  token: string;
}

export const AuthDocs = {
  controller: () =>
    applyDecorators(
      ApiTags("auth"),
      ApiResponse({ status: 403, description: "Forbidden - Insufficient permissions" }),
      ApiResponse({ status: 500, description: "Internal Server Error" }),
    ),

  login: () =>
    applyDecorators(
      ApiOperation({ summary: "Login via username/password" }),
      ApiBody({
        schema: {
          type: 'object',
          properties: {
            username: { type: 'string', example: 'filipe_admin' },
            password: { type: 'string', example: 'senha123' },
            role: { type: 'string', example: 'admin' }
          }
        }
      }),
      ApiResponse({
        status: 200,
        description: "JWT Token returned successfully",
        schema: {
          type: 'object',
          properties: {
            token: { type: 'string' }
          }
        }
      }),
      ApiResponse({ status: 401, description: "Unauthorized - Invalid credentials or role mismatch" }),
    ),

  logout: () =>
    applyDecorators(
      ApiOperation({ summary: "Invalidate the current session token" }),
      ApiResponse({
        status: 200,
        description: "Logout successful",
        type: Boolean,
      })
    ),

  loginGov: () =>
    applyDecorators(
      ApiOperation({ 
        summary: "Start Oauth2 flow with Autenticação.Gov",
        description: "Redirects the user to the government identity provider" 
      }),
      ApiResponse({
        status: 302, 
        description: "Redirecting to Autenticação.Gov portal",
      })
    ),

  verifyToken: () =>
    applyDecorators(
      ApiOperation({
        summary: "Verify AGov Token and Issue Local JWT",
        description: "Callback endpoint after government authentication"
      }),
      ApiResponse({
        status: 200,
        description: "Local session established",
        schema: {
          type: 'object',
          properties: {
            token: { type: 'string' }
          }
        }
      })
    )
};