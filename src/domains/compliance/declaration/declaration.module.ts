import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebsiteDeclaration } from './declaration.entity';
import { WebsiteDeclarationController } from './declaration.controller';
import { WebsiteDeclarationService } from './declaration.service';

@Module({
    imports:[TypeOrmModule.forFeature([WebsiteDeclaration])],
    exports:[WebsiteDeclarationService],
    providers:[WebsiteDeclarationService],
    controllers:[WebsiteDeclarationController]

})
export class DeclarationModule {}
