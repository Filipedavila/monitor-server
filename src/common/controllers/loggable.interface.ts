import {  Logger } from "@nestjs/common";

export interface LoggableController {
  readonly logger: Logger;
}

