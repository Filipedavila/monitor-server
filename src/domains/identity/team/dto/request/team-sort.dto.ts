import { IsOptional } from 'class-validator';
import { IsSortOrder } from 'src/common/decorators/is-sort-order.decorator';
import { SortCriteria } from 'src/common/interfaces/types';
import { Team } from '../../team.entity';



type TargetKeys = keyof Pick<
  Team,
  'id' | 'teamName' | 'createdAt' | 'updatedAt'
>;

type TeamSortContract = {
  [K in TargetKeys]: SortCriteria;
};

export class TeamSortDTO implements TeamSortContract {

  @IsOptional()
  @IsSortOrder()
  id: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  teamName: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  createdAt: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  updatedAt: SortCriteria;
}