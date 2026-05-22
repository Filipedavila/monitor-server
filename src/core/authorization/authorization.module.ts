import { Global, Module } from "@nestjs/common";
import { FgaService } from "./fga.service";
import { FgaClientProvider } from "./fga.provider";

@Global()
@Module({
  providers: [ FgaService, FgaClientProvider],
  exports: [ FgaService, FgaClientProvider ],
})
export class AuthorizationModule {}
