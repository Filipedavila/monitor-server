import { Module } from "@nestjs/common";
import { DirectoryModule } from "./directory/directory.module";
import { PageModule } from "./page/page.module";
import { UserModule } from "../identity/user/user.module";
import { WebsiteModule } from "./website/website.module";
import { TagModule } from "./tag/tag.module";
import { ContextModule } from "./context/context.module";
import { InstitutionModule } from "./institution/institution.module";
@Module({
  imports: [
    ContextModule,
    DirectoryModule,
    PageModule,
    WebsiteModule,
    TagModule,
    InstitutionModule,    
  ],
  exports: [
    ContextModule,
    DirectoryModule,
    PageModule,
    WebsiteModule,
    TagModule,
    InstitutionModule,
  ],
})
export class AccessibilityCatalogModule {}
