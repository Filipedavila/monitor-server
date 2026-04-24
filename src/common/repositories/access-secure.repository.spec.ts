import { Test, TestingModule } from "@nestjs/testing";
import { Repository, Brackets } from "typeorm";
import { createMock, DeepMocked } from "@golevelup/ts-jest";
import { SecureEntityRepository } from "./access-secure.repository";
import {
  AccessScope,
  BaseGrant,
  DatabaseOperation,
  SecurityContext,
} from "src/core/security-authorization/SecurityContext";
import { GranteeType } from "../entities/base-access.entity";
import { AccessLevelCode } from "src/core/security-authorization/entitities/access-level.entity";
import { AppLoggerService } from "src/core/app-logger/app-logger.service";
import { ConfigService } from "@nestjs/config";
import { AccessLevelProvider } from "src/core/security-authorization/access-level.service";
import { createBaseRepoMocks } from "test/utils/base-repository";
import { SecurityContextValidationError } from "src/core/security-authorization/exceptions/security-authorization.exceptions";
import { ColumnMetadata } from "typeorm/metadata/ColumnMetadata.js";

class MockEntity {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
class MockAccess {
  id: number;
  granteeId: number;
  granteeType: GranteeType;
  accessLevel: AccessLevelCode;
  securedResource: MockEntity;
  createdAt: Date;
  updatedAt: Date;
}

class TestSecureRepository extends SecureEntityRepository<
  MockEntity,
  MockAccess,
  any,
  any,
  any,
  any
> {
  protected readonly alias = "entity";
  protected readonly aliasAccessTable = "acc";
  protected readonly filterMap = {};
  protected readonly sortMap = {};
  protected accessStrategy = AccessScope.PRIVATE;
  protected AccessPolicyMap = { [DatabaseOperation.READ]: "VIEWER" } as any;

  public setStrategy(s: AccessScope) {
    (this as any).accessStrategy = s;
  }
  public changeAccessPolicyMap(op: DatabaseOperation, level: AccessLevelCode) {
    (this as any).AccessPolicyMap[op] = level;
  }
}

describe("SecureEntityRepository (Unit Tests)", () => {
  let repository: TestSecureRepository;

  const { mockOrmRepository, mockQueryBuilder, mockLogger, mockConfigService } =
    createBaseRepoMocks(new MockEntity());

  let mockAccessOrm: DeepMocked<Repository<MockAccess>> =
    createMock<Repository<MockAccess>>();
  let mockLevelsProvider: DeepMocked<AccessLevelProvider> =
    createMock<AccessLevelProvider>();

  Object.defineProperty(mockAccessOrm.metadata, "name", {
    value: "MockAccess",
  });
  beforeEach(async () => {
    mockAccessOrm.metadata.findColumnWithPropertyName.mockImplementation(
      (propertyName: string) => {
        const mapping: Record<string, string> = {
          granteeId: "grantee_id",
          granteeType: "grantee_type",
          accessLevel: "access_level",
        };

        if (!mapping[propertyName]) return undefined;

        return {
          databaseName: mapping[propertyName],
        } as unknown as ColumnMetadata;
      },
    );
    mockAccessOrm.metadata.relations = [
      {
        type: expect.any(Function),
        propertyName: "access_relation",
      },
    ] as any;

    mockLevelsProvider.getLevelsForMinimum.mockReturnValue([
      "VIEWER",
      "EDITOR",
      "OWNER",
    ]);

    mockOrmRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.innerJoin.mockReturnThis();
    mockQueryBuilder.leftJoin.mockReturnThis();
    mockQueryBuilder.andWhere.mockReturnThis();
    mockQueryBuilder.distinct.mockReturnThis();
    mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestSecureRepository,
        {
          provide: Repository<MockEntity>,
          useValue: mockOrmRepository,
        },
        {
          provide: Repository<MockAccess>,
          useValue: mockAccessOrm,
        },
        {
          provide: AppLoggerService,
          useValue: mockLogger,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AccessLevelProvider,
          useValue: mockLevelsProvider,
        },
      ],
    }).compile();

    repository = module.get<TestSecureRepository>(TestSecureRepository);
    (repository as any).alias = "entity";
    (repository as any)._relationAccessPath = "access_relation";
    (repository as any).aliasAccessTable = "acc";

    repository.setStrategy(AccessScope.PRIVATE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findSecure Tests", () => {
    // test no securityContext Provided
    it("should throw an error if no security context is provided", async () => {
      await expect(
        repository.findSecure({ filters: {} } as any),
      ).rejects.toThrow(SecurityContextValidationError);
    });

    // test invalid user id should return no grants , try -1 or 0 or letters
    it("should throw an error if user ID is invalid negative number", async () => {
      await expect(
        repository.findSecure({
          securityContext: { userId: -1, roleId: 2, institutionId: 3 },
        } as any),
      ).rejects.toThrow(SecurityContextValidationError);
    });
    it("should throw an error if user ID is invalid format in string", async () => {
      await expect(
        repository.findSecure({
          securityContext: { userId: "l", roleId: 2, institutionId: 3 },
        } as any),
      ).rejects.toThrow(SecurityContextValidationError);
    });
    // test invalid role id should return no grants , try -1 or 0 or letters
    it("should throw an error if role ID is invalid negative number", async () => {
      await expect(
        repository.findSecure({
          securityContext: { userId: 1, roleId: -1, institutionId: 3 },
        } as any),
      ).rejects.toThrow(SecurityContextValidationError);
    });
    it("should throw an error if role ID is invalid format in string", async () => {
      await expect(
        repository.findSecure({
          securityContext: { userId: 1, roleId: "l", institutionId: 3 },
        } as any),
      ).rejects.toThrow(SecurityContextValidationError);
    });

    // test invalid institution id should return no grants , try -1 or 0 or letters
    it("should throw an error if institution ID is invalid negative number", async () => {
      await expect(
        repository.findSecure({
          securityContext: { userId: 1, roleId: 2, institutionId: -1 },
        } as any),
      ).rejects.toThrow(SecurityContextValidationError);
    });
    it("should throw an error if institution ID is invalid format in string", async () => {
      await expect(
        repository.findSecure({
          securityContext: { userId: 1, roleId: 2, institutionId: "l" },
        } as any),
      ).rejects.toThrow(SecurityContextValidationError);
    });
  });

  describe("Generate minimum required grants", () => {
    it("Should generate grants for each identity provided in the security context", () => {
      const securityContext = {
        userId: 1,
        roleId: 2,
        institutionId: 3,
      } as SecurityContext;
      mockLevelsProvider.getLevelsForMinimum.mockReturnValue([
        "VIEWER",
        "EDITOR",
        "OWNER",
      ]);

      const grants = repository["generateRequiredGrants"](
        securityContext,
        DatabaseOperation.READ,
      );

      expect(grants).toEqual([
        {
          granteeId: 1,
          granteeType: GranteeType.USER,
          accessLevel: ["VIEWER", "EDITOR", "OWNER"],
        },
        {
          granteeId: 2,
          granteeType: GranteeType.ROLE,
          accessLevel: ["VIEWER", "EDITOR", "OWNER"],
        },
        {
          granteeId: 3,
          granteeType: GranteeType.INSTITUTION,
          accessLevel: ["VIEWER", "EDITOR", "OWNER"],
        },
      ]);
    });

    it("Should generate grants for each identity provided in the security context ( no institutionId )", () => {
      const securityContext = { userId: 1, roleId: 2 } as SecurityContext;
      mockLevelsProvider.getLevelsForMinimum.mockReturnValue([
        "VIEWER",
        "EDITOR",
        "OWNER",
      ]);

      const grants = repository["generateRequiredGrants"](
        securityContext,
        DatabaseOperation.READ,
      );

      expect(grants).toEqual([
        {
          granteeId: 1,
          granteeType: GranteeType.USER,
          accessLevel: ["VIEWER", "EDITOR", "OWNER"],
        },
        {
          granteeId: 2,
          granteeType: GranteeType.ROLE,
          accessLevel: ["VIEWER", "EDITOR", "OWNER"],
        },
      ]);
    });

    it("Should generate grants based on minimum required access levels", () => {
      //arrange
      const securityContext = {
        userId: 1,
        roleId: 2,
        institutionId: 3,
      } as SecurityContext;
      mockLevelsProvider.getLevelsForMinimum.mockReturnValue([
        "EDITOR",
        "OWNER",
      ]);
      repository.changeAccessPolicyMap(DatabaseOperation.READ, "EDITOR");
      // act
      const grants = repository["generateRequiredGrants"](
        securityContext,
        DatabaseOperation.READ,
      );
      // assert
      expect(grants).toEqual([
        {
          granteeId: 1,
          granteeType: GranteeType.USER,
          accessLevel: ["EDITOR", "OWNER"],
        },
        {
          granteeId: 2,
          granteeType: GranteeType.ROLE,
          accessLevel: ["EDITOR", "OWNER"],
        },
        {
          granteeId: 3,
          granteeType: GranteeType.INSTITUTION,
          accessLevel: ["EDITOR", "OWNER"],
        },
      ]);
    });
    it("Should generate grants based on minimum required access levels 2", () => {
      const securityContext = {
        userId: 1,
        roleId: 2,
        institutionId: 3,
      } as SecurityContext;
      mockLevelsProvider.getLevelsForMinimum.mockReturnValue(["OWNER"]);

      repository.changeAccessPolicyMap(DatabaseOperation.READ, "OWNER");
      const grants = repository["generateRequiredGrants"](
        securityContext,
        DatabaseOperation.READ,
      );

      expect(grants).toEqual([
        {
          granteeId: 1,
          granteeType: GranteeType.USER,
          accessLevel: ["OWNER"],
        },
        {
          granteeId: 2,
          granteeType: GranteeType.ROLE,
          accessLevel: ["OWNER"],
        },
        {
          granteeId: 3,
          granteeType: GranteeType.INSTITUTION,
          accessLevel: ["OWNER"],
        },
      ]);
    });
    it("It should not generate grants when no satisfying levels are returned", () => {
      const securityContext = {
        userId: 1,
        roleId: 2,
        institutionId: 3,
      } as SecurityContext;
      mockLevelsProvider.getLevelsForMinimum.mockReturnValue([]);

      const grants = repository["generateRequiredGrants"](
        securityContext,
        DatabaseOperation.READ,
      );

      expect(grants).toEqual([]);
    });
  });

  describe("Test get id based on grantee type", () => {
    it("Should return correct ID for USER grantee type", () => {
      const securityContext = {
        userId: 1,
        roleId: 2,
        institutionId: 3,
      } as SecurityContext;
      const id = repository["getIdBasedOnGranteeType"](
        securityContext,
        GranteeType.USER,
      );
      expect(id).toBe(1);
    });

    it("Should return correct ID for ROLE grantee type", () => {
      const securityContext = {
        userId: 1,
        roleId: 2,
        institutionId: 3,
      } as SecurityContext;
      const id = repository["getIdBasedOnGranteeType"](
        securityContext,
        GranteeType.ROLE,
      );
      expect(id).toBe(2);
    });

    it("Should return correct ID for INSTITUTION grantee type", () => {
      const securityContext = {
        userId: 1,
        roleId: 2,
        institutionId: 3,
      } as SecurityContext;
      const id = repository["getIdBasedOnGranteeType"](
        securityContext,
        GranteeType.INSTITUTION,
      );
      expect(id).toBe(3);
    });

    it("Should return undefined for INSTITUTION grantee type if institutionId is not provided", () => {
      const securityContext = { userId: 1, roleId: 2 } as SecurityContext;
      const id = repository["getIdBasedOnGranteeType"](
        securityContext,
        GranteeType.INSTITUTION,
      );
      expect(id).toBeUndefined();
    });

    it("Should throw an error for unknown grantee type", () => {
      const securityContext = {
        userId: 1,
        roleId: 2,
        institutionId: 3,
      } as SecurityContext;
      expect(() =>
        repository["getIdBasedOnGranteeType"](
          securityContext,
          "UNKNOWN" as GranteeType,
        ),
      ).toThrow("Unknown grantee type: UNKNOWN");
    });
  });

  describe("applySecureAccessJoin", () => {
    it("Should use INNER JOIN for PRIVATE scope", () => {
      repository.setStrategy(AccessScope.PRIVATE);
      repository["applySecureAccessJoin"](mockQueryBuilder);
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        "entity.access_relation",
        "acc",
      );
    });

    it("Should use LEFT JOIN for INCLUSIVE scope", () => {
      repository.setStrategy(AccessScope.INCLUSIVE);
      repository["applySecureAccessJoin"](mockQueryBuilder);
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        "entity.access_relation",
        "acc",
      );
    });
  });

  describe("Test apply Security Policies ", () => {
    it("Should generate an IN clause for satisfying levels", () => {
      const grants: BaseGrant[] = [
        {
          granteeId: 1,
          granteeType: GranteeType.USER,
          accessLevel: ["VIEWER", "EDITOR"],
        },
      ];

      repository["applySecurityPolicies"](mockQueryBuilder, grants);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      const callArgs = mockQueryBuilder.andWhere.mock.calls[0];
      const whereClause = callArgs[0];
      const parameters = callArgs[1];

      expect(whereClause).toBeInstanceOf(Brackets);
      expect(parameters).toBeUndefined();
    });

    it("Should block all access (1=0) when no identities are provided in PRIVATE scope", () => {
      repository.setStrategy(AccessScope.PRIVATE);
      repository["applySecurityPolicies"](mockQueryBuilder, []);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith("1 = 0");
    });

    it("Should allow access to entities without grants when no identities are provided in INCLUSIVE scope", () => {
      repository.setStrategy(AccessScope.INCLUSIVE);
      repository["applySecurityPolicies"](mockQueryBuilder, []);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith("acc.id IS NULL");
    });

    it("Should allow access to entities with matching grants and also entities without grants in INCLUSIVE scope", () => {
      const grants: BaseGrant[] = [
        {
          granteeId: 1,
          granteeType: GranteeType.USER,
          accessLevel: ["VIEWER", "EDITOR"],
        },
      ];

      repository.setStrategy(AccessScope.INCLUSIVE);
      repository["applySecurityPolicies"](mockQueryBuilder, grants);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      const callArgs = mockQueryBuilder.andWhere.mock.calls[0];
      const whereClause = callArgs[0];
      const parameters = callArgs[1];

      expect(whereClause).toBeInstanceOf(Brackets);
      expect(parameters).toBeUndefined();
    });

    it("Should only allow access to entities with matching grants in PRIVATE scope", () => {
      const grants: BaseGrant[] = [
        {
          granteeId: 1,
          granteeType: GranteeType.USER,
          accessLevel: ["VIEWER", "EDITOR"],
        },
      ];

      repository.setStrategy(AccessScope.PRIVATE);
      repository["applySecurityPolicies"](mockQueryBuilder, grants);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      const callArgs = mockQueryBuilder.andWhere.mock.calls[0];
      const whereClause = callArgs[0];
      const parameters = callArgs[1];

      expect(whereClause).toBeInstanceOf(Brackets);
      expect(parameters).toBeUndefined();
    });

    it("Should correctly execute internal logic for grants within Brackets", () => {
      // Arrange
      const grants: BaseGrant[] = [
        {
          granteeId: 50,
          granteeType: GranteeType.USER,
          accessLevel: ["EDITOR"],
        },
      ];
      repository.setStrategy(AccessScope.PRIVATE);

      // Act
      repository["applySecurityPolicies"](mockQueryBuilder, grants);

      // Assert
      const mainBrackets = mockQueryBuilder.andWhere.mock
        .calls[0][0] as Brackets;
      const mockMainQueryBuilder = { orWhere: jest.fn() };
      mainBrackets.whereFactory(mockMainQueryBuilder as any);

      const identityBrackets = mockMainQueryBuilder.orWhere.mock
        .calls[0][0] as Brackets;
      expect(identityBrackets).toBeInstanceOf(Brackets);

      const mockIdentityQB = { andWhere: jest.fn() };
      identityBrackets.whereFactory(mockIdentityQB as any);

      expect(mockIdentityQB.andWhere).toHaveBeenCalledWith(
        "acc.grantee_id = :auth_granteeId__0",
        { auth_granteeId__0: 50 },
      );
      expect(mockIdentityQB.andWhere).toHaveBeenCalledWith(
        "acc.grantee_type = :auth_granteeType__0",
        { auth_granteeType__0: GranteeType.USER },
      );
      expect(mockIdentityQB.andWhere).toHaveBeenCalledWith(
        "acc.access_level IN (:...auth_accessLevel__0)",
        { auth_accessLevel__0: ["EDITOR"] },
      );
    });

    it("Should generate the correct number of OR-joined blocks when multiple identities are provided", () => {
      // Arrange
      const grants: BaseGrant[] = [
        {
          granteeId: 1,
          granteeType: GranteeType.USER,
          accessLevel: ["VIEWER"],
        },
        {
          granteeId: 10,
          granteeType: GranteeType.ROLE,
          accessLevel: ["EDITOR"],
        },
      ];
      repository.setStrategy(AccessScope.INCLUSIVE);

      // Act
      repository["applySecurityPolicies"](mockQueryBuilder, grants);

      // 3. Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(1);
      const mainBrackets = mockQueryBuilder.andWhere.mock
        .calls[0][0] as Brackets;

      const mockMainQB = { orWhere: jest.fn() };
      mainBrackets.whereFactory(mockMainQB as any);

      /** SQL should have
       * 1. Identity 1 (User)
       * 2. Identity 2 (Role)
       * 3. The IS NULL clause (because the scope is INCLUSIVE)
       */
      expect(mockMainQB.orWhere).toHaveBeenCalledTimes(3);

      expect(mockMainQB.orWhere.mock.calls[0][0]).toBeInstanceOf(Brackets);
      expect(mockMainQB.orWhere.mock.calls[1][0]).toBeInstanceOf(Brackets);

      expect(mockMainQB.orWhere.mock.calls[2][0]).toBe("acc.id IS NULL");
    });
  });
});
