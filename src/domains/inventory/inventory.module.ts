import { Module } from "@nestjs/common";
import { DirectoryModule } from "./directory/directory.module";
import { PageModule } from "./page/page.module";
import { UserModule } from "../identity/user/user.module";
import { WebsiteModule } from "./website/website.module";
import { TagModule } from "./tag/tag.module";
import { OrganizationModule } from "./organization/organization.module";

@Module({
  imports: [
    DirectoryModule,
    PageModule,
    UserModule,
    WebsiteModule,
    TagModule,
    OrganizationModule,
  ],
  exports: [
    DirectoryModule,
    PageModule,
    UserModule,
    WebsiteModule,
    TagModule,
    OrganizationModule,
  ],
})
export class AccessibilityCatalogModule {}
