import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { TagService } from "./tag.service";
import { TagRepository } from "./tag.repository";
import { ContextMap } from "../context/context.enum";
import { Tag } from "./tag.entity";

describe("TagService", () => {
  let service: TagService;
  let tagRepository: {
    findMany: jest.Mock;
    getOrmRepository: jest.Mock;
    findOneBy: jest.Mock;
    runInTransaction: jest.Mock;
    validateContext: jest.Mock;
    deleteBulk: jest.Mock;
  };

  const getValidUser = () => {
    const [roleSlug, context] = Object.entries(ContextMap)[0] ?? [];
    if (!roleSlug || !context) {
      throw new Error("ContextMap must contain at least one role for tests");
    }
    return {
      user: { id: 100, role_slug: roleSlug } as any,
      context,
    };
  };

  beforeEach(async () => {
    tagRepository = {
      findMany: jest.fn(),
      getOrmRepository: jest.fn(),
      findOneBy: jest.fn(),
      runInTransaction: jest.fn(),
      validateContext: jest.fn(),
      deleteBulk: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagService,
        {
          provide: TagRepository,
          useValue: tagRepository,
        },
      ],
    }).compile();

    service = module.get<TagService>(TagService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should call repository.findMany and return pagination result", async () => {
      const { user } = getValidUser();
      const query: any = { filters: { name: "x" }, page: 1, limit: 10 };
      const result = { data: [], count: 0, page: 1, limit: 10 };

      tagRepository.findMany.mockResolvedValue(result);

      await expect(service.findAll(query, user)).resolves.toEqual(result);
      expect(tagRepository.findMany).toHaveBeenCalledWith(query);
    });
  });

  describe("findById", () => {
    it("should throw when role has no context", async () => {
      await expect(
        service.findById(1, { id: 1, role_slug: "__invalid_role__" } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw when tag is not found in context", async () => {
      const { user, context } = getValidUser();
      const ormRepo = { findOne: jest.fn().mockResolvedValue(null) };
      tagRepository.getOrmRepository.mockReturnValue(ormRepo);

      await expect(service.findById(10, user)).rejects.toThrow(NotFoundException);
      expect(ormRepo.findOne).toHaveBeenCalledWith({
        where: { id: 10, contexts: { id: context } },
        relations: ["contexts"],
      });
    });

    it("should return tag when found", async () => {
      const { user, context } = getValidUser();
      const tag = { id: 10, name: "t1" } as Tag;
      const ormRepo = { findOne: jest.fn().mockResolvedValue(tag) };
      tagRepository.getOrmRepository.mockReturnValue(ormRepo);

      await expect(service.findById(10, user)).resolves.toBe(tag);
      expect(ormRepo.findOne).toHaveBeenCalledWith({
        where: { id: 10, contexts: { id: context } },
        relations: ["contexts"],
      });
    });
  });

  describe("findByName", () => {
    it("should throw when tag does not exist", async () => {
      tagRepository.findOneBy.mockResolvedValue(null);
      await expect(service.findByName("missing")).rejects.toThrow(NotFoundException);
      expect(tagRepository.findOneBy).toHaveBeenCalledWith({ name: "missing" });
    });

    it("should return tag when it exists", async () => {
      const tag = { id: 1, name: "exists" } as Tag;
      tagRepository.findOneBy.mockResolvedValue(tag);

      await expect(service.findByName("exists")).resolves.toBe(tag);
      expect(tagRepository.findOneBy).toHaveBeenCalledWith({ name: "exists" });
    });
  });

  describe("update", () => {
    it("should throw when role has no context", async () => {
      await expect(
        service.update({ tagId: 1, name: "new" } as any, {
          id: 1,
          role_slug: "__invalid_role__",
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw when tag not found in transaction", async () => {
      const { user, context } = getValidUser();
      const manager = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn(),
      };
      tagRepository.runInTransaction.mockImplementation(async (cb: any) =>
        cb({ manager }),
      );

      await expect(
        service.update({ tagId: 3, name: "renamed" } as any, user),
      ).rejects.toThrow(NotFoundException);

      expect(manager.findOne).toHaveBeenCalledWith(Tag, {
        where: { id: 3, contexts: { id: context } },
        relations: ["websites", "contexts"],
      });
      expect(manager.save).not.toHaveBeenCalled();
    });

    it("should update and save tag in transaction", async () => {
      const { user, context } = getValidUser();
      const existing = { id: 7, name: "old", websites: [], contexts: [] } as any;
      const manager = {
        findOne: jest.fn().mockResolvedValue(existing),
        save: jest.fn().mockImplementation(async (t) => t),
      };
      tagRepository.runInTransaction.mockImplementation(async (cb: any) =>
        cb({ manager }),
      );

      const result = await service.update({ tagId: 7, name: "new" } as any, user);

      expect(manager.findOne).toHaveBeenCalledWith(Tag, {
        where: { id: 7, contexts: { id: context } },
        relations: ["websites", "contexts"],
      });
      expect(manager.save).toHaveBeenCalledTimes(1);
      expect(result.name).toBe("new");
      expect(result.updatedById).toBe(user.id);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("createOne", () => {
    it("should throw when role has no context", async () => {
      await expect(
        service.createOne({ name: "x" } as any, {
          id: 1,
          role_slug: "__invalid_role__",
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it("should create and save tag in transaction", async () => {
      const { user, context } = getValidUser();
      const manager = {
        save: jest.fn().mockImplementation(async (t) => ({ ...t, id: 9 })),
      };
      tagRepository.runInTransaction.mockImplementation(async (cb: any) =>
        cb({ manager }),
      );

      const created = await service.createOne({ name: "created" } as any, user);

      expect(manager.save).toHaveBeenCalledTimes(1);
      const savedArg = manager.save.mock.calls[0][0];
      expect(savedArg.name).toBe("created");
      expect(savedArg.createdById).toBe(user.id);
      expect(savedArg.createdAt).toBeInstanceOf(Date);
      expect(savedArg.contexts).toEqual([context]);
      expect(created.id).toBe(9);
    });
  });

  describe("deleteBulk", () => {
    it("should return early when ids are empty", async () => {
      const { user } = getValidUser();
      await expect(service.deleteBulk([], user)).resolves.toBeUndefined();
      expect(tagRepository.validateContext).not.toHaveBeenCalled();
      expect(tagRepository.deleteBulk).not.toHaveBeenCalled();
    });

    it("should throw when role has no context", async () => {
      await expect(
        service.deleteBulk([1, 2], { id: 1, role_slug: "__invalid_role__" } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw when permission validation fails", async () => {
      const { user, context } = getValidUser();
      tagRepository.validateContext.mockResolvedValue(false);

      await expect(service.deleteBulk([1, 2], user)).rejects.toThrow(NotFoundException);
      expect(tagRepository.validateContext).toHaveBeenCalledWith(
        [1, 2],
        context,
        user.id,
      );
      expect(tagRepository.deleteBulk).not.toHaveBeenCalled();
    });

    it("should delete when permission validation succeeds", async () => {
      const { user, context } = getValidUser();
      tagRepository.validateContext.mockResolvedValue(true);
      tagRepository.deleteBulk.mockResolvedValue(undefined);

      await expect(service.deleteBulk([10, 20], user)).resolves.toBeUndefined();
      expect(tagRepository.validateContext).toHaveBeenCalledWith(
        [10, 20],
        context,
        user.id,
      );
      expect(tagRepository.deleteBulk).toHaveBeenCalledWith([10, 20]);
    });
  });
});