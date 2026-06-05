import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ManualStatement } from "./entities/manual-statement.entity";
import { ManualStatementService } from "./manual-statement.service";

@Module({
  imports: [TypeOrmModule.forFeature([ManualStatement])],
  providers: [ManualStatementService],
  exports: [ManualStatementService],
})
export class ManualStatementModule {}
