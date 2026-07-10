import { Module } from "@nestjs/common";
import { DirectoryModule } from "./directory/directory.module";
import { PageModule } from "./page/page.module";
import { UserModule } from "../identity/user/user.module";
import { WebsiteModule } from "./website/website.module";
import { TagModule } from "./tag/tag.module";
import { ContextModule } from "./context/context.module";
import { OrganizationModule } from "./organization/organization.module";
@Module({
  imports: [
    ContextModule,
    DirectoryModule,
    PageModule,
    WebsiteModule,
    TagModule,
    OrganizationModule,    
  ],
  exports: [
    ContextModule,
    DirectoryModule,
    PageModule,
    WebsiteModule,
    TagModule,
    OrganizationModule,
  ],
})
export class AccessibilityCatalogModule {}
