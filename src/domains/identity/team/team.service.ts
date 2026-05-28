import { BadRequestException, Injectable, NotImplementedException } from "@nestjs/common";
import { CreateTeamDTO } from "./dto/create-team.dto";
import { TeamDTO } from "./dto/team.dto";
import { Team } from "./team.entity";
import { BaseUser, BaseWebsite } from "src/common/types";
import { TeamRepository } from "./repository/team.repository";
import { plainToInstance } from "class-transformer";

@Injectable()
export class TeamService {
  constructor(private readonly teamRepository: TeamRepository) {}
  async createTeam(createTeamDTO: CreateTeamDTO): Promise<TeamDTO> {
    const team = new Team();
    team.teamName = createTeamDTO.teamName;
  if (createTeamDTO.websiteIds && createTeamDTO.websiteIds.length > 0) {
  const uniqueWebsiteIds = [...new Set(createTeamDTO.websiteIds.map(id => Number.parseInt(id, 10)))];
  
  const count = await this.teamRepository.getOrmRepository().createQueryBuilder("website")
    .where("website.id IN (:...ids)", { ids: uniqueWebsiteIds })
    .getCount();

  if (count !== uniqueWebsiteIds.length) {
    throw new BadRequestException("One or more provided websiteIds do not exist.");
  }

  team.websites = uniqueWebsiteIds.map(id => ({ id } as BaseWebsite));
  }
  if(createTeamDTO.userIds && createTeamDTO.userIds.length > 0) {
    const uniqueUserIds = [...new Set(createTeamDTO.userIds.map(id => parseInt(id, 10)))];
    
    const count = await this.teamRepository.getOrmRepository().createQueryBuilder("user")
      .where("user.id IN (:...ids)", { ids: uniqueUserIds })
      .getCount();

    if (count !== uniqueUserIds.length) {
      throw new BadRequestException("One or more provided userIds do not exist.");
    }

    team.users = uniqueUserIds.map(id => ({ id } as BaseUser));
    } 
    const savedTeam = await this.teamRepository.save(team);
  
  return  plainToInstance(TeamDTO, savedTeam, { excludeExtraneousValues: true });
  
  }

  async getTeamById(id: string): Promise<TeamDTO> {
    
    const team = await this.teamRepository.getOrmRepository().findOne({ where: { id: parseInt(id, 10) }});
    return plainToInstance(TeamDTO, team, { excludeExtraneousValues: true });

  }

  async getAllTeams(): Promise<any> {
    throw new NotImplementedException("Method getAllTeams not implemented.");
  }

  async deleteTeam(id: string): Promise<void> {
    const result = await this.teamRepository.delete(parseInt(id, 10));
    if (result.affected === 0) {
      throw new BadRequestException(`Team with id ${id} not found.`);
    }
  }

  async addUserToTeam(teamId: string, userId: string): Promise<any> {
    const team = await this.teamRepository.getOrmRepository().findOne({ where: { id: parseInt(teamId, 10) }, relations: ["users"] });
    if (!team) {
      throw new BadRequestException(`Team with id ${teamId} not found.`);
    }

    const userExists = team.users.some(user => user.id === parseInt(userId, 10));
    if (userExists) {
      throw new BadRequestException(`User with id ${userId} is already in the team.`);
    }

    team.users.push({ id: parseInt(userId, 10) } as BaseUser);
    await this.teamRepository.save(team);
    return plainToInstance(TeamDTO, team, { excludeExtraneousValues: true });
  }

  async removeUserFromTeam(teamId: string, userId: string): Promise<any> {
    const team = await this.teamRepository.getOrmRepository().findOne({ where: { id: parseInt(teamId, 10) }, relations: ["users"] });
    if (!team) {
      throw new BadRequestException(`Team with id ${teamId} not found.`);
    }

    const userIndex = team.users.findIndex(user => user.id === parseInt(userId, 10));
    if (userIndex === -1) {
      throw new BadRequestException(`User with id ${userId} is not in the team.`);
    }

    team.users.splice(userIndex, 1);
    await this.teamRepository.save(team);
    return plainToInstance(TeamDTO, team, { excludeExtraneousValues: true });
  }

  async addWebsiteToTeam(teamId: string, websiteId: string): Promise<any> {
    const team = await this.teamRepository.getOrmRepository().findOne({ where: { id: parseInt(teamId, 10) }, relations: ["websites"] });
    if (!team) {
      throw new BadRequestException(`Team with id ${teamId} not found.`);
    }

    const websiteExists = team.websites.some(website => website.id === parseInt(websiteId, 10));
    if (websiteExists) {
      throw new BadRequestException(`Website with id ${websiteId} is already in the team.`);
    }

    team.websites.push({ id: parseInt(websiteId, 10) } as BaseWebsite);
    await this.teamRepository.save(team);
    return plainToInstance(TeamDTO, team, { excludeExtraneousValues: true });
  }

  async removeWebsiteFromTeam(teamId: string, websiteId: string): Promise<any> {
    const team = await this.teamRepository.getOrmRepository().findOne({ where: { id: parseInt(teamId, 10) }, relations: ["websites"] });
    if (!team) {
      throw new BadRequestException(`Team with id ${teamId} not found.`);
    }

    const websiteIndex = team.websites.findIndex(website => website.id === parseInt(websiteId, 10));
    if (websiteIndex === -1) {
      throw new BadRequestException(`Website with id ${websiteId} is not in the team.`);
    }

    team.websites.splice(websiteIndex, 1);
    await this.teamRepository.save(team);
    return plainToInstance(TeamDTO, team, { excludeExtraneousValues: true });
  }
}