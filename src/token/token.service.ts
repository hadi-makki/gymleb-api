import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { addDays, addMinutes, differenceInHours } from 'date-fns';
import { Request, Response } from 'express';
import { Model } from 'mongoose';
import { UnauthorizedException } from '../error/unauthorized-error';
import { SuccessMessageReturn } from '../main-classes/success-message-return';
import { Manager } from '../manager/manager.entity';
import { Member } from '../member/entities/member.entity';
import { GenerateTokenDTO } from './token.dto';
import TokenEntity from './token.entity';
import { User } from '../user/user.entity';
import { cookieOptions } from 'src/utils/constants';
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

  async generateAccessToken(
    userId: string,
  ): Promise<{ accessToken: string; accessExpirationDate: Date }> {
    const accessExpirationMinutes = Number(
      this.configService.get('JWT_ACCESS_EXPIRATION_MINUTES'),
    );
    const accessToken = await this.jwtService.signAsync(
      {
        sub: userId,
      },
      {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: accessExpirationMinutes + 'm',
      },
    );
    return {
      accessToken,
      accessExpirationDate: addMinutes(new Date(), accessExpirationMinutes),
    };
  }

  async generateRefreshToken(
    userId: string,
  ): Promise<{ refreshToken: string; refreshExpirationDate: Date }> {
    const refreshExpirationDays = Number(
      this.configService.get('JWT_REFRESH_EXPIRATION_DAYS'),
    );
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: userId,
      },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpirationDays + 'd',
      },
    );
    return {
      refreshToken,
      refreshExpirationDate: addDays(new Date(), refreshExpirationDays),
    };
  }
  async generateTokens({
    userId,
    managerId,
    deviceId,
  }: {
    userId: string;
    managerId?: string;
    deviceId: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    refreshExpirationDate: Date;
  }> {
    const { accessToken, accessExpirationDate } =
      await this.generateAccessToken(userId || managerId);

    const { refreshToken, refreshExpirationDate } =
      await this.generateRefreshToken(userId || managerId);

    await this.storeToken({
      userId,
      managerId,
      accessToken,
      refreshToken,
      accessExpirationDate,
      refreshExpirationDate,
      deviceId,
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
            deviceId: data?.deviceId,
          },
          {
            manager: data?.managerId,
            deviceId: data?.deviceId,
          },
        ],
      })
      .populate('member')
      .populate('manager');

    if (checkToken) {
      checkToken.refreshToken = data.refreshToken;
      checkToken.refreshExpirationDate = data.refreshExpirationDate;
      checkToken.accessToken = data.accessToken;
      checkToken.accessExpirationDate = data.accessExpirationDate;
      if (data.userId && data.userId !== checkToken.member?.id) {
        const member = await this.memberRepository.findById(data.userId);
        if (!member) {
          throw new UnauthorizedException('User not found');
        }
        checkToken.member = member;
      }
      if (data.managerId && data.managerId !== checkToken.manager?.id) {
        const manager = await this.managerRepository.findById(data.managerId);
        if (!manager) {
          throw new UnauthorizedException('Manager not found');
        }
        checkToken.manager = manager;
      }
      return await checkToken.save();
    } else {
      const tokenData = {
        ...data,
        ...(data.userId ? { member: data?.userId } : {}),
        ...(data.managerId ? { manager: data?.managerId } : {}),
      };
      return await this.tokenRepository.create(tokenData);
    }
  }

  async getAccessTokenByDeviceId(
    deviceId: string,
  ): Promise<TokenEntity | null> {
    const getToken = await this.tokenRepository
      .findOne({
        deviceId: deviceId,
      })
      .populate('member')
      .populate('manager');
    return getToken;
  }

  async deleteTokensByUserId(
    userId: string,
    deviceId: string,
  ): Promise<SuccessMessageReturn> {
    const tokenToDelete = await this.tokenRepository.find({
      $or: [
        { member: userId, deviceId: deviceId },
        { manager: userId, deviceId: deviceId },
      ],
    });
    if (tokenToDelete.length > 0) {
      await this.tokenRepository.deleteMany({
        $or: [
          { member: userId, deviceId: deviceId },
          { manager: userId, deviceId: deviceId },
        ],
      });
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
    const token = req.cookies.token;
    const memberToken = req.cookies.memberToken;

    const tokenToUse = isMember ? memberToken : token;

    if (!tokenToUse) {
      throw new UnauthorizedException('Missing Authorization Header');
    }

    let decodedJwt;
    let isTokenExpired = false;

    try {
      decodedJwt = (await this.jwtService.verifyAsync(tokenToUse, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
      })) as {
        sub: string;
        iat: number;
        exp: number;
      };
    } catch (error) {
      // Token is invalid or expired
      isTokenExpired = true;
    }

    // Check if token exists in database and is not expired
    const checkToken = await this.getAccessTokenByDeviceId(
      req.cookies.deviceId,
    );

    if (!checkToken) {
      // Token not found in database
      isTokenExpired = true;
    } else if (
      differenceInHours(new Date(), checkToken.accessExpirationDate) > 0
    ) {
      // Check if token is expired by date
      isTokenExpired = true;
    }

    // If token is expired, try to refresh it
    if (isTokenExpired) {
      const newToken = await this.refreshToken(
        tokenToUse,
        req.cookies.deviceId,
        res,
      );
      if (newToken) {
        // Return the new decoded JWT
        return (await this.jwtService.verifyAsync(newToken, {
          secret: this.configService.get('JWT_ACCESS_SECRET'),
        })) as {
          sub: string;
          iat: number;
          exp: number;
        };
      } else {
        throw new UnauthorizedException('Unable to refresh token');
      }
    }

    return decodedJwt;
  }

  async refreshToken(
    token: string,
    deviceId: string,
    res: Response,
  ): Promise<string | null> {
    try {
      const checkToken = await this.getAccessTokenByDeviceId(deviceId);

      if (!checkToken) {
        return null;
      }

      // Verify refresh token
      const decodedJwt = (await this.jwtService.verifyAsync(
        checkToken.refreshToken,
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
        },
      )) as {
        sub: string;
        iat: number;
        exp: number;
      };
      if (decodedJwt) {
        // check if the token is expired

        if (
          differenceInHours(new Date(), checkToken.refreshExpirationDate) > 0
        ) {
          return null;
        }
        const { accessToken, accessExpirationDate } =
          await this.generateAccessToken(decodedJwt.sub);
        checkToken.accessToken = accessToken;
        checkToken.accessExpirationDate = accessExpirationDate;
        await checkToken.save();

        // Set the new token in cookies
        const cookieName = checkToken.member ? 'memberToken' : 'token';
        res.cookie(cookieName, accessToken, cookieOptions);

        return accessToken;
      }
      return null;
    } catch (error) {
      // Refresh token is also expired or invalid
      return null;
    }
  }
}
