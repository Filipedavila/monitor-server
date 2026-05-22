import { Injectable,InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import {  InjectRepository } from "@nestjs/typeorm";
import {   Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { User } from "../../domains/identity/user/user.entity";
import { InvalidToken } from "./entitities/invalid-token.entity";
import { comparePasswordHash } from "../../common/security";
import axios from "axios";
import { NAME_CONVERTER, NIC } from "./constants/constants";
import { AppLoggerService } from "../app-logger/app-logger.service";
import { ConfigService } from "@nestjs/config/dist/config.service";
export interface JWTTokenPayload {
  username: string;
  sub: number;
  role: string;
  hash: string;
}
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(InvalidToken)
    private readonly invalidTokenRepository: Repository<InvalidToken>,
    private readonly jwtService: JwtService,
     private readonly configService: ConfigService, 
    private readonly logger: AppLoggerService,
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

  async loginLocal(username: string, password: string): Promise<{ id: number; token: string } | null> {
    const user = await this.verifyUserCredentials(
       username,
       password,
     );
     if (!user || !user.id || !user.username || !user.role || !user.uniqueHash) {
       throw new UnauthorizedException();
     }
     const payload: JWTTokenPayload = {
       sub: user.id,
       username: user.username,
       role: user.role?.slug,
       hash: user.uniqueHash,
     };
      return { id: user.id, token: this.signToken(payload) };
  }


async updateUserLastLogin(userId: number): Promise<void> {

    const date = new Date()
        .toISOString()
        .replace(/T/, " ")
        .replace(/\..+/, "");
    const result = await this.userRepository.update(userId, { lastLogin: date });
    
    if (!(result.affected != null && result.affected > 0)) {
      throw new InternalServerErrorException(`Failed to update last login for user ${userId}`);
    }
}

  async verifyUserCredentials(
    username: string,
    password: string,
  ): Promise<Partial<User> | null> {
    const user = await this.userRepository.findOne({
      where: { username: username },
      relations: ['role'],
      select: ['id', 'username', 'password', 'role','uniqueHash'] 
})  

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

  generateAuthToken(user: User): string {
    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role.slug,
      hash: user.uniqueHash,
    };
    return this.signToken(payload);
  }

  signToken(payload: JWTTokenPayload): string {
    return this.jwtService.sign(payload, { algorithm: "HS256" });
  }

  verifyJWT(jwt: string): any {

      return this.jwtService.verify(jwt);

  }
  async logout(token: string): Promise<void> {

      const alreadyInvalid = await this.isTokenBlackListed(token);
      if (alreadyInvalid) {
        return ; 
      }

      let expiresAt: Date;
      try {
        const payload = this.jwtService.decode(token);

        expiresAt = payload?.exp ? new Date(payload.exp * 1000) : new Date();
        
        if (expiresAt < new Date()) return ;
        
      } catch {
        this.logger.warn('Could not decode JWT exp, using fallback expiration');
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 1);
      }


      await this.invalidTokenRepository.insert({
        token,
        expiresAt,
      });

      return;
    
  }

  async verifyLoginUser(token: string) {
    const atributes = await this.getAtributes(token);
    const ccNumber = atributes.cc;
    if (!ccNumber) {
      return null;
    }
    await this.userRepository.update({ ccNumber }, { lastLogin: new Date() });
    return this.userRepository.findOne({ where: { ccNumber } });
  }
  async getAtributes(token: string) {
    const AUTH_SERVER = this.configService.get('AUTH_SERVER');
    const atributesName = [
      "http://interop.gov.pt/MDC/Cidadao/NIC",
      "http://interop.gov.pt/MDC/Cidadao/NomeCompleto",
    ];
    const responseStart = await axios.post(
      `${AUTH_SERVER}/oauthresourceserver/api/AttributeManager`,
      { token, atributesName }
    );
    const authenticationContextId = responseStart.data.authenticationContextId;
    const responseAtributes = await axios.get(
      `${AUTH_SERVER}/oauthresourceserver/api/AttributeManager?token=${token}&authenticationContextId=${authenticationContextId}`
    );
    return this.parseAtributes(responseAtributes.data);
  }

  private parseAtributes(atributes: any[]) {
    const result = { cc: null, name: "" };
    atributes.forEach((attr) => {
      const mappedKey = NAME_CONVERTER[attr.name];
      if (mappedKey) result[mappedKey] = attr.value;
    });
    return result;
  }

  /*
  public async findUserByGovId(govUserId: number): Promise<User> {

    return await this.userRepository.findOneOrFail({
      where: { govUser: { id: govUserId } },
    });
  }*/
}
