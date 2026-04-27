import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { User } from "../user/user.entity";
import { AppsInvalidToken } from "./apps-invalid-token.entity";
import { comparePasswordHash } from "../lib/security";
import axios from "axios";
import { NAME_CONVERTER, NIC } from "./apps-constants";
import { GovUserService } from "src/gov-user/gov-user.service";

@Injectable()
export class AppsAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly govUserService: GovUserService,
    @InjectRepository(AppsInvalidToken)
    private readonly appsInvalidTokenRepository: Repository<AppsInvalidToken>,
    @InjectDataSource()
    private readonly connection: DataSource,
    private readonly jwtService: JwtService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanInvalidSessionTokens(): Promise<void> {
    // Called at midnight every day
    await this.appsInvalidTokenRepository.query(
      `DELETE FROM Invalid_Token WHERE Expiration_Date < NOW()`
    );
  }

  async isTokenBlackListed(token: string): Promise<boolean> {
    const invalidToken = await this.appsInvalidTokenRepository.findOne({
      where: { AppsToken: token },
    });
    return !!invalidToken;
  }

  async updateUserLastLogin(userId: number, date: any): Promise<boolean> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    let error = false;
    try {
      await queryRunner.manager.update(
        User,
        { UserId: userId },
        { Last_Login: date }
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      error = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !error;
  }

  async verifyUserCredentials(
    username: string,
    password: string
  ): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { Username: username },
    });

    if (user && (await comparePasswordHash(password, user.Password))) {
      delete user.Password;
      delete user.Names;
      delete user.Emails;
      delete user.Last_Login;
      delete user.Register_Date;
      return user;
    } else {
      return null;
    }
  }

  async verifyUserPayload(payload: any): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: {
        UserId: payload.sub,
        Username: payload.username,
        Type: payload.type,
        Unique_Hash: payload.hash,
      },
    });
    return !!user;
  }

  login(user: any): string {
    const payload = {
      username: user.Username,
      sub: user.UserId,
      type: user.Type,
      hash: user.Unique_Hash,
    };
    return this.signToken(payload);
  }

  signToken(payload: any): string {
    return this.jwtService.sign(payload, { algorithm: "HS256" });
  }

  verifyJWT(jwt: string): any {
    try {
      return this.jwtService.verify(jwt);
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }

  async logout(token: string): Promise<any> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const invalidToken = new AppsInvalidToken();
    invalidToken.AppsToken = token;
    invalidToken.Expiration_Date = tomorrow;

    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    let error = false;

    try {
      const saved = await queryRunner.manager.save(invalidToken);
      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      error = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !error;
  }
  async verifyLoginUser(token: string) {
    const atributes = await this.getAtributes(token);
    const ccNumber = atributes.cc;
    await this.govUserService.updateLogin(ccNumber);
    return this.govUserService.findOneByCC(ccNumber);
  }

  async getAtributes(token: string) {
    const atributesName = [
      "http://interop.gov.pt/MDC/Cidadao/NIC",
      "http://interop.gov.pt/MDC/Cidadao/NomeCompleto",
    ];
    const responseStart = await axios.post(
      "https://preprod.autenticacao.gov.pt/oauthresourceserver/api/AttributeManager",
      { token, atributesName }
    );
    const authenticationContextId = responseStart.data.authenticationContextId;
    const responseAtributes = await axios.get(
      `https://preprod.autenticacao.gov.pt/oauthresourceserver/api/AttributeManager?token=${token}&authenticationContextId=${authenticationContextId}`
    );
    return this.parseAtributes(responseAtributes.data);
  }

  private parseAtributes(atributes: any) {
    let result = { cc: null, name: "" };
    atributes.map((atribute) => {
      const name = atribute.name;
      const realName = NAME_CONVERTER[name];
      result[realName] = atribute.value;
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
