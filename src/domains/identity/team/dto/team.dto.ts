
export class TeamDTO {
  id: number;
  teamName: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TeamDetailsDTO extends TeamDTO {
  websiteIds: number[];
  userIds: number[];
}