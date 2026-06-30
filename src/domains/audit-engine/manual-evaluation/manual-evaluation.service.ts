import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";

import { Website } from "../../inventory/website/website.entity";
import { EvaluationAspect, ManualEvaluation, TestResultEntry } from "./manual-evaluation.entity";

@Injectable()
export class ManualEvaluationService {
  constructor(
    @InjectRepository(ManualEvaluation)
    private readonly aspectRepository: Repository<ManualEvaluation>,
    @InjectRepository(Website)
    private readonly websiteRepository: Repository<Website>,
    private readonly dataSource: DataSource,
  ) {}

  async createEvaluation(type: EvaluationAspect, data: any): Promise<boolean> {
    const formData = data.formData;
    
    try {
      const website = await this.websiteRepository.findOne({
        where: { baseUrl: formData["site-url"] }
      });

      if (!website) throw new NotFoundException("Website does not exist");

      const { results, conformance } = this.processGroups(type, formData);

      const aspectResult = this.aspectRepository.create({
        websiteId: website.id,
        aspect: type, 
        evaluationDate: formData["site-evaluation-date"] 
          ? new Date(formData["site-evaluation-date"]) 
          : new Date(),
        complianceScore: conformance, 
        rawResult: results, 
      });
      await this.aspectRepository.save(aspectResult);
      return true;

    } catch (err) {
      console.error(`[ManualEvaluationService] Error processing ${type}:`, err);
      return false;
    }
  }

  private processGroups(type: EvaluationAspect, formData: any): { results: Record<string, TestResultEntry[]>; conformance: number } {
    const results: Record<string, TestResultEntry[]> = {};
    let conform = 0;
    let applicable = 0;


    const config = this.getAspectConfig(type);

    for (const [group, totalTests] of Object.entries(config)) {
      results[group] = [];
      
      for (let t = 1; t <= totalTests; t++) {
        const resKey = `testResult['group_${group}']['test_${group}-${t}']`;
        const factKey = `testFacts['group_${group}']['test_${group}-${t}']`;
        const noteKey = `testNotes['group_${group}']['test_${group}-${t}']`;

        const resValue = formData[resKey];

        if (resValue && resValue !== "NA") {
          applicable++;
          if (resValue === "P") conform++;
        }

        results[group].push({
          group: parseInt(group),
          test: t,
          results: resValue,
          evidences: formData[factKey],
          notes: formData[noteKey],
        });
      }
    }

    const conformance = applicable > 0 ? (conform / applicable) * 100 : 0;
    return { results, conformance };
  }

  private getAspectConfig(type: EvaluationAspect): Record<number, number> {
    const configs = {
      [EvaluationAspect.FUNCTIONAL]: { 1: 3, 2: 2, 3: 2, 4: 3, 5: 3, 6: 2, 7: 2, 8: 5, 9: 4, 10: 1 },
      [EvaluationAspect.TRANSACTION]: { 1: 3, 2: 4, 3: 2, 4: 4 },
      [EvaluationAspect.CONTENT]: { 1: 4, 2: 4, 3: 3, 4: 2, 5: 4 }
    };
    return configs[type];
  }

  /**
   * Obtém todos os resultados de um determinado aspeto (Content, Functional, Transaction).
   * @param aspect O tipo de aspeto (EvaluationAspect enum)
   */
  async findAllByAspect(aspect: EvaluationAspect): Promise<ManualEvaluation[]> {
    try {
      return await this.aspectRepository.find({
        where: { aspect },
        relations: ['website'],
        order: {
          evaluationDate: 'DESC',
        },
      });
    } catch (error) {
      console.error(`[ManualEvaluationService] Failed to fetch results for aspect: ${aspect}`, error);
      throw new InternalServerErrorException(`Could not retrieve manual evaluation results for ${aspect}`);
    }
  }

  
  async findAllByWebsite(websiteId: number): Promise<ManualEvaluation[]> {
    try {
      return await this.aspectRepository.find({
        where: { websiteId },
        order: {
          aspect: 'ASC',
          evaluationDate: 'DESC',
        },
      });
    } catch (error) {
      console.error(`[ManualEvaluationService] Failed to fetch results for websiteId: ${websiteId}`, error);
      throw new InternalServerErrorException(`Could not retrieve evaluations for website ID ${websiteId}`);
    }
  }

}