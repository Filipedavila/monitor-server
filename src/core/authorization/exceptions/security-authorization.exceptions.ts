export class SecurityContextValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SecurityContextValidationError";
  }
}

export class UnknownGranteeTypeException extends Error {
  constructor(granteeType: string) {
    super(`Unknown grantee type: ${granteeType}`);
    this.name = "UnknownGrantieeTypeException";
  }
}

export class AccessLevelNotFoundException extends Error {
  constructor(levelId: number) {
    super(`Access level with ID ${levelId} not found`);
    this.name = "AccessLevelNotFoundException";
  }
}

export class AccessLevelCodeNotFoundException extends Error {
  constructor(levelCode: string) {
    super(`Access level with code ${levelCode} not found`);
    this.name = "AccessLevelCodeNotFoundException";
  }
}

export class NonExistingAccessRelationException extends Error {
  constructor(entityId: number | string, accessLevelId: number) {
    super(
      `No existing access relation found for entity ID ${entityId} with access level ID ${accessLevelId}`,
    );
    this.name = "NonExistingAccessRelationException";
  }
}

export class AccessRelationNotFoundException extends Error {
  constructor(sourceEntity: string, targetEntity: string) {
    super(
      ` No relation found between ${sourceEntity} and ${targetEntity}. Define the relation in the Entity!`,
    );
    this.name = "AccessRelationNotFoundException";
  }
}
