import { CreateAutomaticEvaluationDto } from "src/domains/compliance/possibly-trash/automatic-statement/dto/create-automatic-evaluation.dto";
import { CreateContactDto } from "src/domains/compliance/contact/dto/create-contact.dto";
import { CreateManualEvaluationDto } from "src/domains/compliance/possibly-trash/manual-statement/dto/create-manual-evaluation.dto";
import { CreateUserEvaluationDto } from "src/domains/compliance/possibly-trash/user-evaluation/dto/create-user-evaluation.dto";
import { State } from "../state";

export class AccessibilityStatementDto {
  url: string;
  conformance: string;
  statementDate: Date;
  state?: State;
  autoList: Array<CreateAutomaticEvaluationDto>;
  userList: Array<CreateUserEvaluationDto>;
  manualList: Array<CreateManualEvaluationDto>;
  contacts: Array<CreateContactDto>;
}
