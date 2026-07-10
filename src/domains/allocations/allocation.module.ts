import { Module } from '@nestjs/common';

import { RelationsModule } from './relations/relations.module';

@Module({
  imports: [ RelationsModule],
  exports: [RelationsModule]
})
export class AllocationModule {}
