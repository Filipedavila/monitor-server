import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './roles.entity';
import { RoleSlug } from 'src/core/authentication/interfaces/types';

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
    roles.forEach((role) => this.roleCache.set(role.slug, role.id));
  }


  getRoleIdBySlug(slug: RoleSlug): number {
    const id = this.roleCache.get(slug);
    if (!id) {
      throw new NotFoundException(`Role with slug ${slug} not found in cache.`);
    }
    return id;
  }
}