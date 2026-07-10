import { IsOptional } from 'class-validator';
import { Evaluation } from '../../entities/evaluation.entity';
import { IsSortOrder } from 'src/common/decorators/is-sort-order.decorator';
import { SortCriteria } from 'src/common/interfaces/types';



type TargetKeys = keyof Pick<
  Evaluation, 
  'pageId' | 'pageTitle' | 'score' | 'A' | 'AA' | 'AAA' | 'tagCount' | 'createdAt' | 'updatedAt'
>;

type EvaluationSortContract = {
  [K in TargetKeys]: SortCriteria;
};

export class EvaluationSortDTO implements EvaluationSortContract {
  
  @IsOptional()
  @IsSortOrder()
  pageId: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  pageTitle: SortCriteria;
  
  @IsOptional()
  @IsSortOrder()
  score: SortCriteria;
  
  @IsOptional()
  @IsSortOrder()
  A: SortCriteria;
  
  @IsOptional()
  @IsSortOrder()
  AA: SortCriteria;
  
  @IsOptional()
  @IsSortOrder()
  AAA: SortCriteria;
  
  @IsOptional()
  @IsSortOrder()
  contexts: SortCriteria;
  
  @IsOptional()
  @IsSortOrder()
  tagCount: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  createdAt: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  updatedAt: SortCriteria;

    
}