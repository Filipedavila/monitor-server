import { Injectable,InternalServerErrorException,Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource,  Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { User } from "../../domains/identity/user/user.entity";
import { InvalidToken } from "./entitities/invalid-token.entity";
import { comparePasswordHash } from "../../common/security";
import axios from "axios";
import { NAME_CONVERTER, NIC } from "./constants/constants";
import { GovUserService } from "src/domains/identity/gov-user/gov-user.service";
export interface JWTTokenPayload {
  username: string;
  sub: number;
  role: string;
  hash: string;
  orgs: string[];
}
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly govUserService: GovUserService,
    @InjectRepository(InvalidToken)
    private readonly invalidTokenRepository: Repository<InvalidToken>,
    @InjectDataSource()
    private readonly connection: DataSource,
    private readonly jwtService: JwtService,
    private readonly logger: Logger,
  ) {}

@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanInvalidSessionTokens(): Promise<void> {
    await this.invalidTokenRepository
      .createQueryBuilder()
      .delete()
      .where("expiresAt < :now", { now: new Date() })
      .execute();
    
    this.logger.log('Expired tokens cleaned successfully');
  }

  async isTokenBlackListed(token: string): Promise<boolean> {
    const invalidToken = await this.invalidTokenRepository.findOne({
      where: { token: token },
    });
    return !!invalidToken;
  }


async updateUserLastLogin(userId: number, date: string): Promise<boolean> {
  try {
    const result = await this.userRepository.update(userId, { lastLogin: date });
    
    return result.affected != null && result.affected > 0;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    this.logger.error(`Error updating last login for user ${userId}: ${errorMessage}`);
    return false;
  }
}
  async verifyUserCredentials(
    username: string,
    password: string,
  ): Promise<Partial<User> | null> {
    const user = await this.userRepository.findOne({
      where: { username: username },
    });

    if (user && (await comparePasswordHash(password, user.password))) {
      const {
        password: _,
        createdAt: __,
        lastLogin: ___,
        ...userWithoutPrivateDetails
      } = user;
      return userWithoutPrivateDetails;
    } else {
      return null;
    }
  }

async verifyUserPayload(payload: JWTTokenPayload): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: ['id', 'uniqueHash'] 
    });
    return !!user && user.uniqueHash === payload.hash;
  }

  login(user: User): string {
    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role.slug,
      hash: user.uniqueHash,
      orgs: user.organizations.map(org => org.id.toString()),
    };
    return this.signToken(payload);
  }

  signToken(payload: JWTTokenPayload): string {
    return this.jwtService.sign(payload, { algorithm: "HS256" });
  }

  verifyJWT(jwt: string): any {
    try {
      return this.jwtService.verify(jwt);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`JWT verification failed: ${errorMessage}`);
      return undefined;
    }
  }

async logout(token: string): Promise<boolean> {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    await this.invalidTokenRepository.insert({
      token,
      expiresAt,
    });

    return true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    this.logger.error(`Error invalidating token: ${errorMessage}`);
    return false;
  }
}

  async verifyLoginUser(token: string) {
    const atributes = await this.getAtributes(token);
    const ccNumber = atributes.cc;
    if (!ccNumber) {
      return null;
    }
    await this.govUserService.updateLogin(ccNumber);
    return this.govUserService.findOneByCC(ccNumber);
  }

  async getAtributes(token: string) {
    const atributesName = [
      "http://interop.gov.pt/MDC/Cidadao/NIC",
      "http://interop.gov.pt/MDC/Cidadao/NomeCompleto",
    ];
    try {
    const responseStart = await axios.post(
      "https://preprod.autenticacao.gov.pt/oauthresourceserver/api/AttributeManager",
      { token, atributesName },
    );
    const authenticationContextId = responseStart.data.authenticationContextId;
    
    const responseAtributes = await axios.get(
      `https://preprod.autenticacao.gov.pt/oauthresourceserver/api/AttributeManager?token=${token}&authenticationContextId=${authenticationContextId}`,
    );
    return this.parseAtributes(responseAtributes.data);
  } catch  {
    throw new InternalServerErrorException('Error fetching user attributes from Autenticação.Gov');
  }
  }
  
  private parseAtributes(atributes: any[]) {
    const result = { cc: null, name: "" };
    atributes.forEach((attr) => {
      const mappedKey = NAME_CONVERTER[attr.name];
      if (mappedKey) result[mappedKey] = attr.value;
    });
    return result;
  }
}
/**
 * > [                                                                                                                            │
   {                                                                                                                          │
 name: 'http://interop.gov.pt/MDC/Cidadao/NIC',                                                                           │
  value: '15366302',                                                                                                       │
  state: 'Available'                                                                                                       │
},                                                                                                                         │
{                                                                                                                          │
  name: 'http://interop.gov.pt/MDC/Cidadao/NomeCompleto',                                                                  │
  value: 'ANTÓNIO MANUEL SANTOS ESTRIGA',                                                                                  │
  state: 'Available'                                                                                                       │
}                                                                                                                          │
│                                                         ]
 */
