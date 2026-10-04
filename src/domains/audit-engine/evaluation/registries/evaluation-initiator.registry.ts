import { BadRequestException, Injectable } from '@nestjs/common';
import { EvaluationTriggerType } from '../dto/evaluation-trigger.dto';
import { EvaluationInitiator } from '../contracts/evaluation-initiator.contract';

@Injectable()
export class EvaluationInitiatorRegistry {
  private readonly initiators = new Map<EvaluationTriggerType, EvaluationInitiator>();

  register(initiator: EvaluationInitiator): void {
    if (this.initiators.has(initiator.triggerType)) {
      throw new Error(
        `Evaluation initiator for trigger type [${initiator.triggerType}] is already registered.`,
      );
    }
    this.initiators.set(initiator.triggerType, initiator);
  }

  get(triggerType: EvaluationTriggerType): EvaluationInitiator {
    const initiator = this.initiators.get(triggerType);
    if (!initiator) {
      throw new BadRequestException(
        `No initiator registered for evaluation trigger type: ${triggerType}`,
      );
    }
    return initiator;
  }
}
