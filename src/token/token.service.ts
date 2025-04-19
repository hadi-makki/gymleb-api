import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { addDays } from 'date-fns';
import { Request, Response } from 'express';
import { Model } from 'mongoose';
import { UnauthorizedException } from 'src/error/unauthorized-error';
import { SuccessMessageReturn } from 'src/main-classes/success-message-return';
import { Manager } from 'src/manager/manager.entity';
import { User } from 'src/user/user.entity';
import { GenerateTokenDTO } from './token.dto';
import TokenEntity from './token.entity';
import { FastifyRequest, FastifyReply } from 'fastify';
@Injectable()
export class TokenService {
  constructor(
    @InjectModel(TokenEntity.name)
    private readonly tokenRepository: Model<TokenEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(User.name)
    private readonly userRepository: Model<User>,
    // private readonly TokenService: TokenService,
    @InjectModel(Manager.name)
    private readonly managerRepository: Model<Manager>,
  ) {}
  async generateTokens({
    userId,
    managerId,
  }: {
    userId: string;
    managerId?: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    refreshExpirationDate: Date;
  }> {
    const refreshExpirationDays = this.configService.get(
      'JWT_REFRESH_EXPIRATION_DAYS',
    );
    const refreshExpirationDate = addDays(new Date(), refreshExpirationDays);

    const accessExpirationDays = this.configService.get(
      'JWT_ACCESS_EXPIRATION_MINUTES',
    );
    const accessExpirationDate = addDays(new Date(), accessExpirationDays);
    const accessToken = await this.jwtService.signAsync(
      {
        sub: userId || managerId,
      },
      {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: accessExpirationDays + 'd',
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: userId || managerId,
      },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpirationDays + 'd',
      },
    );

    await this.storeToken({
      userId,
      managerId,
      accessToken,
      refreshToken,
      accessExpirationDate,
      refreshExpirationDate,
    });

    return {
      accessToken,
      refreshToken,
      refreshExpirationDate,
    };
  }
  async storeToken(data: GenerateTokenDTO): Promise<TokenEntity> {
    const checkToken = await this.tokenRepository
      .findOne({
        $or: [
          {
            user: data?.userId,
          },
          {
            manager: data?.managerId,
          },
        ],
      })
      .populate('user')
      .populate('manager');

    if (checkToken) {
      checkToken.refreshToken = data.refreshToken;
      checkToken.refreshExpirationDate = data.refreshExpirationDate;
      checkToken.accessToken = data.accessToken;
      checkToken.accessExpirationDate = data.accessExpirationDate;
      if (data.userId && data.userId !== checkToken.user.id) {
        const user = await this.userRepository.findById(data.userId);
        checkToken.user = user;
      }
      if (data.managerId && data.managerId !== checkToken.manager.id) {
        const manager = await this.managerRepository.findById(data.managerId);
        checkToken.manager = manager;
      }
      return await checkToken.save();
    } else {
      const tokenData = {
        ...data,
        ...(data.userId ? { user: data?.userId } : {}),
        ...(data.managerId ? { manager: data?.managerId } : {}),
      };
      console.log('tokenData', tokenData);
      return await this.tokenRepository.create(tokenData);
    }
  }

  async getTokenByAccessToken(token: string): Promise<TokenEntity> {
    return await this.tokenRepository.findOne({
      accessToken: token,
    });
  }

  async deleteTokensByUserId(userId: string): Promise<SuccessMessageReturn> {
    const tokenToDelete = await this.tokenRepository.find({
      user: {
        id: userId,
      },
    });
    if (tokenToDelete) {
      await this.tokenRepository.deleteMany({ user: { id: userId } });
    }
    return {
      message: 'Tokens deleted successfully',
    };
  }

  async getTokensByUserId(userId: string): Promise<TokenEntity[]> {
    return await this.tokenRepository.findOne({
      user: {
        id: userId,
      },
    });
  }

  async validateJwt(
    req: FastifyRequest,
    res: FastifyReply,
  ): Promise<{
    sub: string;
    iat: number;
    exp: number;
  }> {
    const token = req.cookies.token;

    console.log('token', token);

    if (!token) {
      throw new UnauthorizedException('Missing Authorization Header');
    }
    try {
      const decodedJwt = (await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
      })) as {
        sub: string;
        iat: number;
        exp: number;
      };

      const checkToken = await this.getTokenByAccessToken(token);

      if (!checkToken) {
        throw new UnauthorizedException('Invalid Token');
      }
      return decodedJwt;
    } catch (error) {
      throw new UnauthorizedException('Invalid Token');
    }
  }
}
