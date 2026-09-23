import { Injectable, OnModuleInit, ForbiddenException } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EvaluationRepository } from '../../evaluation.repository';
import { EvaluationInitiator } from '../../contracts/evaluation-initiator.contract';
import { EvaluationTriggerType } from '../../dto/evaluation-trigger.dto';
import { EvaluationInitiatorRegistry } from '../../registries/evaluation-initiator.registry';
import { SecurityContext } from 'src/core/authorization/SecurityContext';
import { FgaService } from 'src/core/authorization/fga.service';

@Injectable()
export class TagEvaluationInitiationStrategy implements EvaluationInitiator, OnModuleInit {
  readonly triggerType = EvaluationTriggerType.TAGS;

  constructor(
    private readonly registry: EvaluationInitiatorRegistry,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly evaluationRepository: EvaluationRepository,
    private readonly openFgaService: FgaService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async initiate(securityContext: SecurityContext, targetIds: number[]): Promise<void> {
    if (!targetIds?.length) {
      throw new BadRequestException('At least one tag ID must be provided.');
    }

    const isAllowed = await this.openFgaService.check(
      `user:${securityContext.user.id}`,
      'can_manage_users',
      'role:ams',
    );
    if (!isAllowed) {
      throw new ForbiddenException('User is not allowed to trigger directory evaluations.');
    }

    // IR bucar todas as Páginas deste diredtorio

    // Criar Id idemepotente

    // Adicionar ao job queue process website. por batch de 500 websites
  }
}
