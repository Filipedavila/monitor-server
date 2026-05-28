import { applyDecorators } from "@nestjs/common";
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam, 
  ApiBody 
} from "@nestjs/swagger";

export const TeamDocs = {
  controller: () => applyDecorators(
    ApiTags("Teams"),
    ApiBearerAuth(), 
    ApiResponse({ status: 401, description: "Unauthorized - Token inválido ou ausente." }),
    ApiResponse({ status: 403, description: "Forbidden - Permissões insuficientes." }),
    ApiResponse({ status: 500, description: "Internal Server Error." })
  ),

  createTeam: () => applyDecorators(
    ApiOperation({ summary: "Criar uma nova equipa", description: "Apenas administradores podem criar equipas." }),
    ApiBody({ 
      schema: { 
        type: "object", 
        properties: { name: { type: "string", example: "Engineering Alpha" } }, 
        required: ["name"] 
      } 
    }),
    ApiResponse({ status: 201, description: "Equipa criada com sucesso." })
  ),

  getTeamById: () => applyDecorators(
    ApiOperation({ summary: "Obter equipa por ID" }),
    ApiParam({ name: "id", type: "string", description: "UUID ou ID numérico da equipa" }),
    ApiResponse({ status: 200, description: "Dados da equipa retornados com sucesso." }),
    ApiResponse({ status: 404, description: "Equipa não encontrada." })
  ),

  getAllTeams: () => applyDecorators(
    ApiOperation({ summary: "Listar todas as equipas" }),
    ApiResponse({ status: 200, description: "Lista de equipas retornada com sucesso." })
  ),

  deleteTeam: () => applyDecorators(
    ApiOperation({ summary: "Remover uma equipa", description: "Remove logicamente ou fisicamente a equipa pelo ID." }),
    ApiParam({ name: "id", type: "string" }),
    ApiResponse({ status: 200, description: "Equipa removida com sucesso." })
  ),

  addUserToTeam: () => applyDecorators(
    ApiOperation({ summary: "Adicionar utilizador a uma equipa" }),
    ApiParam({ name: "id", type: "string", description: "ID da equipa" }),
    ApiBody({ 
      schema: { 
        type: "object", 
        properties: { userId: { type: "string", example: "usr_12345" } }, 
        required: ["userId"] 
      } 
    }),
    ApiResponse({ status: 200, description: "Utilizador associado com sucesso." })
  ),

  removeUserFromTeam: () => applyDecorators(
    ApiOperation({ summary: "Remover utilizador de uma equipa" }),
    ApiParam({ name: "id", type: "string" }),
    ApiBody({ 
      schema: { 
        type: "object", 
        properties: { userId: { type: "string" } }, 
        required: ["userId"] 
      } 
    }),
    ApiResponse({ status: 200, description: "Utilizador removido com sucesso." })
  ),

  addWebsiteToTeam: () => applyDecorators(
    ApiOperation({ summary: "Adicionar website à equipa" }),
    ApiParam({ name: "id", type: "string" }),
    ApiBody({ 
      schema: { 
        type: "object", 
        properties: { websiteId: { type: "string" } }, 
        required: ["websiteId"] 
      } 
    }),
    ApiResponse({ status: 200, description: "Website associado com sucesso." })
  ),

  removeWebsiteFromTeam: () => applyDecorators(
    ApiOperation({ summary: "Remover website da equipa" }),
    ApiParam({ name: "id", type: "string" }),
    ApiBody({ 
      schema: { 
        type: "object", 
        properties: { websiteId: { type: "string" } }, 
        required: ["websiteId"] 
      } 
    }),
    ApiResponse({ status: 200, description: "Website removido com sucesso." })
  ),
};