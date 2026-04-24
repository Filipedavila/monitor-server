import { Logger } from "@nestjs/common";

export class BaseService {
  protected readonly logger: Logger;

  constructor(protected readonly serviceContext: string) {
    this.logger = new Logger(serviceContext);
  }
}
