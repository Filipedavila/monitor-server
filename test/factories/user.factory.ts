import { Factory } from "fishery";
import { faker } from "@faker-js/faker";
import { User } from "src/domains/identity/user/user.entity";
import { Role } from "src/domains/identity/role/roles.entity";

interface PageTransient {
  role?: Role;
}
export const userFactory = Factory.define<User, PageTransient>(
  ({ sequence, transientParams, onCreate }) => {
    onCreate(async (user) => {
      return user;
    });
    const AdminRole: Role = {
      id: 1,
      slug: "nimda",
      displayName: "Admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      id: sequence,
      role: transientParams.role || AdminRole,
      role_id: transientParams.role?.id || AdminRole.id,
      ownerRoleId: transientParams.role?.id || AdminRole.id,
      createdBy: 1,
      updatedBy: 1,
      username: faker.internet.userName(),
      password: faker.string.alphanumeric(16),
      fullName: faker.name.fullName(),
      email: faker.internet.email(),
    } as User;
  },
);
