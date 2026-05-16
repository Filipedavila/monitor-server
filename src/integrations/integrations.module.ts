import { Module } from "@nestjs/common";
import { AmpModule } from "./amp/amp.module";
import { ObservatoryModule } from "./observatory/observatory.module";
import { ApiSeloModule } from "./api-selo/api-selo.module";

const modules = [AmpModule, ApiSeloModule, ObservatoryModule];
@Module({
  imports: modules,
  exports: modules,
})
export class IntegrationsModule {}
