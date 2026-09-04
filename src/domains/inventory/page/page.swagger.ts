import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Page } from './page.entity';
import { UpdatePageContextDto } from './dto/update.page-context.dto';
import { CreatePageDto } from './dto/create-page.dto';

export const PageDocs = {
  controller: () =>
    applyDecorators(
      ApiTags('Pages'),
      ApiBearerAuth(),
      ApiResponse({ status: 401, description: 'Unauthorized - Token JWT inválido ou ausente' }),
      ApiResponse({
        status: 403,
        description: 'Forbidden - Sem permissões RBAC ou ReBAC (OpenFGA)',
      }),
    ),

  find: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Listar páginas filtradas por contexto',
        description:
          'Retorna uma lista paginada de páginas de acordo com os filtros, ordenação e contextos autorizados pelo utilizador.',
      }),
      ApiResponse({
        status: 200,
        description: 'Lista paginada de páginas recuperada com sucesso',
        type: [Page],
      }),
      ApiResponse({ status: 400, description: 'Parâmetros de query inválidos' }),
    ),

  findOne: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Obter detalhes de uma página específica de um website',
        description: 'Requer permissão de leitura sobre o website no OpenFGA (`website:can_view`).',
      }),
      ApiParam({
        name: 'websiteId',
        type: Number,
        description: 'ID do website proprietário',
        example: 10,
      }),
      ApiParam({
        name: 'pageId',
        type: Number,
        description: 'ID da página',
        example: 42,
      }),
      ApiResponse({
        status: 200,
        description: 'Página encontrada com sucesso',
        type: Page,
      }),
      ApiResponse({ status: 404, description: 'Página ou website não encontrado' }),
    ),

  create: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Criar uma nova página num website',
        description: 'Requer permissão de edição sobre o website no OpenFGA (`website:can_edit`).',
      }),
      ApiParam({
        name: 'websiteId',
        type: Number,
        description: 'ID do website onde a página será criada',
        example: 10,
      }),
      ApiBody({ type: CreatePageDto }),
      ApiResponse({
        status: 201,
        description: 'Página criada com sucesso',
        type: Page,
      }),
      ApiResponse({ status: 400, description: 'Dados inválidos ou URL duplicado' }),
    ),

  bulkDelete: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Remover páginas em lote ou desassociar contextos',
        description:
          'Remove a alocação de contexto associada à role do utilizador. Se a página não tiver mais nenhum contexto alocado, é eliminada permanentemente.',
      }),
      ApiBody({
        schema: {
          type: 'object',
          required: ['ids'],
          properties: {
            ids: {
              type: 'array',
              items: { type: 'integer' },
              example: [1, 2, 3],
              description: 'Lista de IDs das páginas a remover/desalocar',
            },
          },
        },
      }),
      ApiResponse({
        status: 200,
        description: 'Páginas processadas/removidas com sucesso',
      }),
      ApiResponse({
        status: 400,
        description: 'Role do utilizador não possui contexto associado ou payload inválido',
      }),
    ),

  changePageContext: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Alterar os contextos atribuídos a um conjunto de páginas',
        description:
          'Atualização em lote dos contextos (ex: Study Monitor, My Monitor) para os IDs fornecidos.',
      }),
      ApiBody({
        type: UpdatePageContextDto,
        description: 'Payload contendo a lista de pageIds e os novos contextos',
      }),
      ApiResponse({
        status: 200,
        description: 'Contextos atualizados com sucesso',
      }),
      ApiResponse({ status: 400, description: 'Dados de contexto ou páginas inválidos' }),
    ),
};
