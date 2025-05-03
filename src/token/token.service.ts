import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { addDays } from 'date-fns';
import { Request, Response } from 'express';
import { Model } from 'mongoose';
import { UnauthorizedException } from '../error/unauthorized-error';
import { SuccessMessageReturn } from '../main-classes/success-message-return';
import { Manager } from '../manager/manager.entity';
import { Member } from '../member/entities/member.entity';
import { GenerateTokenDTO } from './token.dto';
import TokenEntity from './token.entity';
import { User } from '../user/user.entity';
@Injectable()
export class TokenService {
  constructor(
    @InjectModel(TokenEntity.name)
    private readonly tokenRepository: Model<TokenEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,

    @InjectModel(Member.name)
    private readonly memberRepository: Model<Member>,
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
            member: data?.userId,
          },
          {
            manager: data?.managerId,
          },
        ],
      })
      .populate('member')
      .populate('manager');

    if (checkToken) {
      console.log('checkToken', checkToken);
      checkToken.refreshToken = data.refreshToken;
      checkToken.refreshExpirationDate = data.refreshExpirationDate;
      checkToken.accessToken = data.accessToken;
      checkToken.accessExpirationDate = data.accessExpirationDate;
      if (data.userId && data.userId !== checkToken.member?.id) {
        console.log('data.userId', data.userId);
        const member = await this.memberRepository.findById(data.userId);
        if (!member) {
          throw new UnauthorizedException('User not found');
        }
        checkToken.member = member;
      }
      if (data.managerId && data.managerId !== checkToken.manager?.id) {
        console.log('data.managerId', data.managerId);
        const manager = await this.managerRepository.findById(data.managerId);
        if (!manager) {
          throw new UnauthorizedException('Manager not found');
        }
        checkToken.manager = manager;
      }
      console.log('checkToken', checkToken);
      return await checkToken.save();
    } else {
      console.log('data.userId', data.userId);
      const tokenData = {
        ...data,
        ...(data.userId ? { member: data?.userId } : {}),
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
      member: {
        id: userId,
      },
    });
    if (tokenToDelete) {
      await this.tokenRepository.deleteMany({ member: { id: userId } });
    }
    return {
      message: 'Tokens deleted successfully',
    };
  }

  async getTokensByUserId(userId: string): Promise<TokenEntity[]> {
    return await this.tokenRepository.findOne({
      member: {
        id: userId,
      },
    });
  }

  async validateJwt(
    req: Request & { user: User | Manager | Member },
    res: Response,
    isMember: boolean = false,
  ): Promise<{
    sub: string;
    iat: number;
    exp: number;
  }> {
    console.log('req.cookies', req.cookies);
    const token = req.cookies.token;
    const memberToken = req.cookies.memberToken;

    const tokenToUse = isMember ? memberToken : token;

    if (!tokenToUse) {
      console.log('missing token');
      throw new UnauthorizedException('Missing Authorization Header');
    }

    const decodedJwt = (await this.jwtService.verifyAsync(tokenToUse, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
    })) as {
      sub: string;
      iat: number;
      exp: number;
    };

    const checkToken = await this.getTokenByAccessToken(tokenToUse);

    if (!checkToken) {
      throw new UnauthorizedException('Invalid Token');
    }
    return decodedJwt;
  }
}
