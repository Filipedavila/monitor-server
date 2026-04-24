import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import mysqldump from "mysqldump";

@Injectable()
export class DumpService {
  constructor(private readonly configService: ConfigService) {}

  private get databaseConfig() {
    return {
      host: this.configService.get<string>("DB_HOST")!,
      port: this.configService.get<number>("DB_PORT")!,
      user: this.configService.get<string>("DB_USERNAME")!,
      password: this.configService.get<string>("DB_PASSWORD")!,
      database: this.configService.get<string>("DB_DATABASE")!,
    };
  }
  path = "./dump.sql.gz";
  createDump() {
    mysqldump({
      connection: this.databaseConfig,
      dumpToFile: this.path,
      compressFile: true,
    });
  }
}
