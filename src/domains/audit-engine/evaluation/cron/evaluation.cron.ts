import { Cron } from "@nestjs/schedule";
import * as fs from "fs";
import { CronExpression } from "@nestjs/schedule";

export class EvaluationCron {
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  cleanUpErrorFiles(): void {
    fs.readdir("./", (err: NodeJS.ErrnoException | null, files: string[]) => {
      if (!err) {
        for (const file of files ?? []) {
          if (file.startsWith("qualweb-errors")) {
            fs.unlink(file, (err2: NodeJS.ErrnoException | null) => {
              if (err2) {
                console.error(err2);
              }
            });
          }
        }
      }
    });
  }
}
