import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";

import { Website } from "../../inventory/website/website.entity";
import { EvaluationAspect, ManualEvaluationResult } from "./manual-evaluation.entity";

@Injectable()
export class ManualEvaluationService {
  constructor(
    @InjectRepository(ManualEvaluationResult)
    private readonly aspectRepository: Repository<ManualEvaluationResult>,
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
        website_id: website.id,
        aspect_type: type,
        evaluation_date: formData["site-evaluation-date"] ? new Date(formData["site-evaluation-date"]) : new Date(),
        conformance_score: conformance,
        evaluation_result: JSON.stringify(results),
      });

      await this.aspectRepository.save(aspectResult);
      return true;

    } catch (err) {
      console.error(`[AspectEvaluationService] Error processing ${type}:`, err);
      return false;
    }
  }

  private processGroups(type: EvaluationAspect, formData: any) {
    const results = {};
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
}