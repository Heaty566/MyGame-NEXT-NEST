import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/entities/user.entity';
import { UserRepository } from '../user/entities/user.repository';
import { AuthToken } from './entities/authToken.entity';
import { AuthTokenRepository } from './entities/authToken.repository';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
      constructor(private userRepository: UserRepository, private authTokenRepository: AuthTokenRepository, private jwt: JwtService) {}

      private async createAuthToken(data: any) {
            let authToken = new AuthToken();
            authToken.data = this.createJwtStringToken({ user: data });
            authToken = await this.saveAuthToken(authToken);
            return authToken;
      }

      async createRefreshToken(data: any) {
            let authToken = await this.createAuthToken(data);
            return this.createJwtStringToken({ authTokenId: authToken._id });
      }

      async getDataFromRefreshToken(refreshToken: string) {
            const decode = this.decodeToken(refreshToken);
            return await this.authTokenRepository.findOneByField('_id', decode['authTokenId']);
      }

      async getDataFromAuthToken(authToken: string) {
            return await this.authTokenRepository.findOneByField('_id', authToken);
      }

      createJwtStringToken(tokenData: Record<any, any>) {
            return this.jwt.sign(tokenData);
      }

      decodeToken(tokenData: string) {
            return this.jwt.decode(tokenData);
      }

      async registerUser(input: User): Promise<User> {
            return await this.userRepository.save(input);
      }

      async saveAuthToken(input: AuthToken): Promise<AuthToken> {
            return await this.authTokenRepository.save(input);
      }

      async hash(data: string): Promise<string> {
            return await bcrypt.hash(data, 5);
      }

      async comparePassword(data: string, password: string): Promise<boolean> {
            return bcrypt.compare(data, password);
      }
}
