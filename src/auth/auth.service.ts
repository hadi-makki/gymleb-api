import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { TokenEntity } from 'src/token/token.entity';
import { UserEntity } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '../error/unauthorized-error';
import { TokenService } from '../token/token.service';
import { UserService } from '../user/user.service';
@Injectable()
export class AuthService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectRepository(TokenEntity)
    private readonly tokenRepository: Repository<TokenEntity>,
  ) {}

  // Generate access and refresh tokens for a user on a specific device.
  generateTokens(user: UserEntity, deviceId: string) {
    const payload = { sub: user.id, deviceId };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return { accessToken, refreshToken };
  }

  async test() {
    this.userService.test();
    return 'test';
  }
  // Refresh tokens: Validate the refresh token and update tokens.
  async refreshToken(token: string, deviceId: string) {
    const tokenDoc = await this.tokenRepository.findOne({
      where: { deviceId, accessToken: token },
    });
    if (!tokenDoc) {
      throw new UnauthorizedException('Refresh token not found');
    }

    //validate the refresh token
    const payload = this.jwtService.verify(tokenDoc.refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });

    if (!payload) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.getUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = this.generateTokens(user, deviceId);

    tokenDoc.accessToken = tokens.accessToken;
    await this.tokenRepository.save(tokenDoc);

    return {
      token: tokens.accessToken,
    };
  }

  async validateJwt(req: any) {
    const token = req.headers.authorization?.split(' ')[1];
    const getTokenFromDb = await this.tokenRepository.findOne({
      where: { accessToken: token },
    });
    if (!token || !getTokenFromDb) {
      throw new UnauthorizedException('Unauthorized');
    }
    try {
      return this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Unauthorized');
    }
  }
}
