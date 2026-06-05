import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AccessibilityStatement } from "../../accessibility-statement/entities/accessibility-statement.entity";
import { CreateAutomaticEvaluationDto } from "./dto/create-automatic-evaluation.dto";
import { AutomaticStatement } from "./entities/automatic-statement.entity";

@Injectable()
export class AutomaticStatementService {
  constructor(
    @InjectRepository(AutomaticStatement)
    private readonly automaticEvaluationRepository: Repository<AutomaticStatement>,
  ) {}
  create(
    createAutomaticEvaluationDto: CreateAutomaticEvaluationDto,
    accessibilityStatement: AccessibilityStatement,
  ) {
    const evaluation = this.automaticEvaluationRepository.create({
      ...createAutomaticEvaluationDto,
      accessibilityStatement,
    });
    return this.automaticEvaluationRepository.save(evaluation);
  }

  async getLength() {
    return (
      await this.automaticEvaluationRepository.query(
        `SELECT COUNT(*) as length FROM Automatic_Evaluation`,
      )
    )[0].length;
  }
}
