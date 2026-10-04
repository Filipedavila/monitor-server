import { SecurityContext } from '@core/authentication/interfaces/types';
import { EvaluationTriggerType } from '../dto/evaluation-trigger.dto';

export interface EvaluationInitiator {
  readonly triggerType: EvaluationTriggerType;
  initiate(context: SecurityContext, targetIds?: number[]): Promise<void>;
}
