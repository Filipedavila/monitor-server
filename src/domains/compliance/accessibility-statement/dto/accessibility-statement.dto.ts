
import { State } from "../state";

export class AccessibilityStatementDto {
  websiteId: string;
  conformance: string;
  evidence: string ;
  seal: string ;
  statementDate: Date
  state?: State;
}
