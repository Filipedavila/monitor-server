import {  Logger } from "@nestjs/common";



export abstract class BaseController {
  protected readonly logger: Logger;
  constructor(context: string) {
    this.logger = new Logger(context);
  }


}
