import { IsOptional } from 'class-validator';
import { IsSortOrder } from 'src/common/decorators/is-sort-order.decorator';
import { SortCriteria } from 'src/common/interfaces/types';
import { AccessibilityStatement } from '../../entities/accessibility-statement.entity'; 



type TargetKeys = keyof Pick<
  AccessibilityStatement, 
  "id" | "websiteId" | "conformance" | "evidence" | "seal" | "statementDate" | "state" |"createdAt" | "lastConsultedAt"
>;

type UserSortContract = {
  [K in TargetKeys]: SortCriteria;
};

export class AccessibilityStatementSortDTO implements UserSortContract {
  
  @IsOptional()
  @IsSortOrder()
  id: SortCriteria;


  @IsOptional()
  @IsSortOrder()
  websiteId: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  conformance: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  evidence: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  seal: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  statementDate: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  state: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  createdAt: SortCriteria;

  @IsOptional()
  @IsSortOrder()
  lastConsultedAt: SortCriteria;

    
}