import { Module } from '@nestjs/common';

import { RelationsModule } from './relations/relations.module';
import { WebsiteAllocationsModule } from './website-allocations/website-allocations.module';

@Module({
  imports: [ RelationsModule, WebsiteAllocationsModule],
  exports: [RelationsModule]
})
export class AllocationModule {}
