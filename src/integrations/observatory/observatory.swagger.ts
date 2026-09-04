import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';

export const ObservatoryDocs = {
  controller: () => applyDecorators(ApiTags('Observatory')),

  getGlobalMetrics: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Obter métricas globais do Observatório',
        description:
          'Retorna os dados agregados de conformidade e acessibilidade de todos os diretórios e websites monitorizados.',
      }),
      ApiResponse({
        status: 200,
        description: 'Métricas globais agregadas com sucesso',
      }),
    ),

  getDirectoriesRanks: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Listar estatísticas e rankings de diretórios',
        description: 'Retorna o ranking e métricas comparativas agrupadas por diretório/organismo.',
      }),
      ApiResponse({
        status: 200,
        description: 'Estatísticas dos diretórios recuperadas com sucesso',
      }),
    ),

  getDirectoryWebsites: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Listar websites associados a um diretório específico',
        description:
          'Recupera todos os websites monitorizados que pertencem ao diretório especificado por ID.',
      }),
      ApiParam({
        name: 'id',
        type: Number,
        description: 'Identificador único do diretório',
        example: 1,
      }),
      ApiResponse({
        status: 200,
        description: 'Lista de websites associados ao diretório recuperada com sucesso',
      }),
      ApiResponse({ status: 404, description: 'Diretório não encontrado' }),
    ),

  getDirectoryStatistics: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Obter estatísticas consolidadas de um diretório',
        description:
          'Retorna as pontuações médias, conformidade WCAG e métricas agregadas do diretório.',
      }),
      ApiParam({
        name: 'id',
        type: Number,
        description: 'Identificador único do diretório',
        example: 1,
      }),
      ApiResponse({
        status: 200,
        description: 'Estatísticas do diretório recuperadas com sucesso',
      }),
      ApiResponse({ status: 404, description: 'Diretório não encontrado' }),
    ),

  searchWebsites: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Pesquisar websites no Observatório',
        description:
          'Executa uma pesquisa textual sobre os websites monitorizados com base num termo de query.',
      }),
      ApiQuery({
        name: 'query',
        type: String,
        required: true,
        description: 'Termo de pesquisa (nome do website ou URL)',
        example: 'justica',
      }),
      ApiResponse({
        status: 200,
        description: 'Resultados da pesquisa obtidos com sucesso',
      }),
      ApiResponse({ status: 400, description: 'Query de pesquisa inválida ou ausente' }),
    ),

  getWebsiteMetrics: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Obter métricas do Observatório para um website específico',
        description:
          'Retorna os dados de evolução temporal, conformidade e auditorias associadas ao website.',
      }),
      ApiParam({
        name: 'id',
        type: Number,
        description: 'Identificador único do website',
        example: 42,
      }),
      ApiResponse({
        status: 200,
        description: 'Métricas do website obtidas com sucesso',
      }),
      ApiResponse({ status: 404, description: 'Website não encontrado' }),
    ),
};
