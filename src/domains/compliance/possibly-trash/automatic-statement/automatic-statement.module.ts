import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AutomaticStatementService } from "./automatic-statement.service";
import { AutomaticStatement } from "./entities/automatic-statement.entity";

@Module({
  imports: [TypeOrmModule.forFeature([AutomaticStatement])],
  providers: [AutomaticStatementService],
  exports: [AutomaticStatementService],
})
export class AutomaticStatementModule {}
