import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { CreateTeamDTO } from "./dto/create-team.dto";
import { TeamDetailsDTO, TeamDTO } from "./dto/team.dto";
import { TeamRepository } from "./repository/team.repository";
import { plainToInstance } from "class-transformer";
import { PaginationResponse } from "src/common/repositories/base.repository";
import { TeamQueryDTO } from "./dto/request/team-request.dto";
import { AuthenticatedUser } from "src/core/authentication/interfaces/types";


@Injectable()
export class TeamService {
  constructor(private readonly teamRepository: TeamRepository) {}


  async createTeam(actor: AuthenticatedUser, createTeamDTO: CreateTeamDTO): Promise<TeamDTO> {
  const existingTeam = await this.teamRepository.getOrmRepository().findOne({ 
    where: { teamName: createTeamDTO.teamName } 
  });
  if (existingTeam) {
    throw new ConflictException(`A team with the name "${createTeamDTO.teamName}" already exists.`);
  }
  const websiteIds:number[] = []
  const userIds:number[] = []

  if (createTeamDTO.websiteIds?.length > 0) {
    websiteIds.push(...createTeamDTO.websiteIds);
  }
  if (createTeamDTO.userIds?.length > 0) {
    userIds.push(...createTeamDTO.userIds);
  }
  const savedTeam = await this.teamRepository.createTeam( createTeamDTO.teamName, websiteIds, userIds,actor.id);
    return plainToInstance(TeamDTO, savedTeam, { excludeExtraneousValues: true });

}

  async getTeamById(id: number): Promise<TeamDetailsDTO> {
    
    const team = await this.teamRepository.getOrmRepository().findOne({ where: { id: id }, relations: ["users", "websites"] });
    return plainToInstance(TeamDetailsDTO, team, { excludeExtraneousValues: true });

  }

  async getAllTeams(query: TeamQueryDTO): Promise<PaginationResponse<TeamDTO>> {
    const {data, meta } = await this.teamRepository.findMany({
      filters: query.filters,
      sortings: query.sorts,
      pagination: query.pagination,
    });

    return {
      data: data.map(team =>
        plainToInstance(TeamDTO, team, { excludeExtraneousValues: true }),
      ),
      meta: {
        totalItems: meta.totalItems,
        currentPage: meta.currentPage,
        totalPages: meta.totalPages,
        itemsPerPage: meta.itemsPerPage,
      },
    };
  }

  async deleteTeam(id: number): Promise<void> {
     await this.teamRepository.deleteTeam(id);
  }

  async addUsersToTeam(teamId: number, userIds: number[], actorId: number): Promise<TeamDetailsDTO> {
    const team = await this.teamRepository.getOrmRepository().findOne({ where: { id: teamId } });
    if (!team) {
      throw new BadRequestException(`Team with id ${teamId} not found.`);
    }
      
    const updatedTeam = await this.teamRepository.addUsersToTeam(teamId, userIds, actorId);
  
    return plainToInstance(TeamDetailsDTO, updatedTeam, { excludeExtraneousValues: true });
  }

  async removeUsersFromTeam(teamId: number, userIds: number[], actorId: number): Promise<TeamDetailsDTO> {
    const team = await this.teamRepository.getOrmRepository().findOne({ where: { id: teamId }});
    if (!team) {
      throw new BadRequestException(`Team with id ${teamId} not found.`);
    }

    const updatedTeam = await this.teamRepository.removeUsersFromTeam(teamId, userIds, actorId);
    return plainToInstance(TeamDetailsDTO, updatedTeam, { excludeExtraneousValues: true });
  }

  async addWebsitesToTeam(teamId: number, websiteIds: number[], actorId: number): Promise<TeamDetailsDTO> {
    const team = await this.teamRepository.getOrmRepository().findOne({ where: { id: teamId } });
    if (!team) {
      throw new BadRequestException(`Team with id ${teamId} not found.`);
    }

    const updatedTeam = await this.teamRepository.addWebsitesToTeam(teamId, websiteIds,actorId);
    return plainToInstance(TeamDetailsDTO, updatedTeam, { excludeExtraneousValues: true });
  }

  async removeWebsitesFromTeam(teamId: number, websiteIds: number[], actorId: number): Promise<TeamDetailsDTO> {
    const team = await this.teamRepository.getOrmRepository().findOne({ where: { id: teamId }});
    if (!team) {
      throw new BadRequestException(`Team with id ${teamId} not found.`);
    }
    const updatedTeam = await this.teamRepository.removeWebsitesFromTeam(teamId, websiteIds, actorId);
    return plainToInstance(TeamDetailsDTO, updatedTeam, { excludeExtraneousValues: true });
  }

}