import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './roles.entity';
import { RoleSlug, RoleSlugMap } from 'src/core/authentication/interfaces/types';

@Injectable()
export class RoleService implements OnModuleInit {
  private readonly roleCache = new Map<RoleSlug, number>();

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}


  async onModuleInit() {
    await this.refreshCache();
  }

  async refreshCache() {
    const roles = await this.roleRepository.find();
    this.roleCache.clear();
    roles.forEach((role) =>{ 
      const role_slug = RoleSlugMap[role.slug];
      if (!role_slug) {
        throw new NotFoundException(`Invalid role slug: ${role.slug}`);
      }
      this.roleCache.set(role_slug, role.id);
     });
  }


  getRoleIdBySlug(slug: RoleSlug): number {
    const id = this.roleCache.get(slug);
    if (!id) {
      throw new NotFoundException(`Role with slug ${slug} not found in cache.`);
    }
    return id;
  }
  getSlugByRoleId(id: number): RoleSlug {
    for (const [slug, roleId] of this.roleCache.entries()) {
      if (roleId === id) {
        return slug;
      }
    }
    throw new NotFoundException(`Role with ID ${id} not found in cache.`);
  }
}