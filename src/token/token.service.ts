import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { addDays, addMinutes, differenceInHours } from 'date-fns';
import { Request, Response } from 'express';
import { ManagerEntity } from 'src/manager/manager.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { Not, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { UnauthorizedException } from '../error/unauthorized-error';
import { SuccessMessageReturn } from '../main-classes/success-message-return';
import { CookieNames, cookieOptions } from '../utils/constants';
import { GenerateTokenDTO } from './token.dto';
import { TokenEntity } from './token.entity';
@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(TokenEntity)
    private readonly tokenRepository: Repository<TokenEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,

    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
    // private readonly TokenService: TokenService,
    @InjectRepository(ManagerEntity)
    private readonly managerRepository: Repository<ManagerEntity>,
  ) {}

  private readonly logger = new Logger(TokenService.name);

  private formatToBeirut(date: Date): string {
    try {
      return new Date(date).toLocaleString('en-GB', {
        timeZone: 'Asia/Beirut',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return date.toISOString();
    }
  }

  private formatEpochSecondsToBeirut(epochSeconds: number): string {
    return this.formatToBeirut(new Date(epochSeconds * 1000));
  }

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
    const checkToken = await this.tokenRepository.findOne({
      where: [
        {
          member: { id: data?.userId },
          deviceId: data?.deviceId,
        },
        {
          manager: { id: data?.managerId },
          deviceId: data?.deviceId,
        },
      ],
      relations: {
        member: true,
        manager: true,
      },
    });

    if (checkToken) {
      checkToken.refreshToken = data.refreshToken;
      checkToken.refreshExpirationDate = data.refreshExpirationDate;
      checkToken.accessToken = data.accessToken;
      checkToken.accessExpirationDate = data.accessExpirationDate;
      if (data.userId && data.userId !== checkToken.member?.id) {
        const member = await this.memberRepository.findOne({
          where: { id: data.userId },
        });
        if (!member) {
          throw new UnauthorizedException('User not found');
        }
        checkToken.member = member;
      }
      if (data.managerId && data.managerId !== checkToken.manager?.id) {
        const manager = await this.managerRepository.findOne({
          where: { id: data.managerId },
        });
        if (!manager) {
          throw new UnauthorizedException('Manager not found');
        }
        checkToken.manager = manager;
      }
      return await this.tokenRepository.save(checkToken);
    } else {
      const tokenData = {
        ...data,
        ...(data.userId ? { member: { id: data?.userId } } : {}),
        ...(data.managerId ? { manager: { id: data?.managerId } } : {}),
        mongoId: uuidv4(),
      };
      return await this.tokenRepository.save(tokenData);
    }
  }

  async getAccessTokenByDeviceIdAndAccessToken(
    deviceId: string,
    accessToken: string,
  ): Promise<TokenEntity | null> {
    const getToken = await this.tokenRepository.findOne({
      where: {
        deviceId: deviceId,
        accessToken: accessToken,
      },
      relations: {
        member: true,
        manager: true,
      },
    });
    return getToken;
  }

  async getTokenByDeviceId(deviceId: string): Promise<TokenEntity | null> {
    const getToken = await this.tokenRepository.findOne({
      where: {
        deviceId: deviceId,
      },
      relations: {
        member: true,
        manager: true,
      },
    });
    return getToken;
  }

  async deleteTokensByUserId(
    userId: string,
    deviceId?: string,
  ): Promise<SuccessMessageReturn> {
    const query = deviceId
      ? [
          { member: { id: userId }, deviceId: deviceId },
          { manager: { id: userId }, deviceId: deviceId },
        ]
      : [{ member: { id: userId } }, { manager: { id: userId } }];

    const tokenToDelete = await this.tokenRepository.find({
      where: query,
    });
    if (tokenToDelete.length > 0) {
      await this.tokenRepository.remove(tokenToDelete);
    }
    return {
      message: 'Tokens deleted successfully',
    };
  }

  async deleteAllTokensExceptCurrentDevice(
    managerId: string,
    currentDeviceId: string,
  ): Promise<SuccessMessageReturn> {
    console.log('these are the current device id', currentDeviceId);
    console.log('these are the manager id', managerId);
    const tokensToDelete = await this.tokenRepository.find({
      where: [
        {
          manager: { id: managerId },
          deviceId: Not(currentDeviceId),
        },
      ],
    });

    console.log('these are the tokens to delete', tokensToDelete);

    if (tokensToDelete.length > 0) {
      await this.tokenRepository.remove(tokensToDelete);
    }

    return {
      message: 'Logged out from other devices successfully',
    };
  }

  async getTokensByUserId(userId: string): Promise<TokenEntity[]> {
    return await this.tokenRepository.find({
      where: {
        member: {
          id: userId,
        },
      },
      relations: {
        member: true,
        manager: true,
      },
    });
  }

  async validateJwt(
    req: Request & {
      user: MemberEntity | ManagerEntity;
    },
    res: Response,
    isMember: boolean = false,
  ): Promise<{
    sub: string;
    iat: number;
    exp: number;
  }> {
    const token = req.cookies[CookieNames.ManagerToken];
    const memberToken = req.cookies[CookieNames.MemberToken];

    const tokenToUse = isMember ? memberToken : token;

    if (!tokenToUse) {
      this.logger.warn(
        `Missing auth cookie. isMember=${isMember} deviceId=${req.cookies?.deviceId || 'unknown'}`,
      );
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
      this.logger.warn(
        `Access token verification failed. isMember=${isMember} deviceId=${req.cookies?.[CookieNames.DeviceId] || 'unknown'} error=${(error as Error)?.message}`,
      );
      isTokenExpired = true;
    }

    // If token is expired (or rotated), try to recover gracefully
    if (isTokenExpired) {
      // Concurrency-safe fallback: if another request already rotated the token,
      // accept the latest token for this device when it matches the same subject
      if (decodedJwt) {
        const latestTokenDoc = await this.getTokenByDeviceId(
          req.cookies[CookieNames.DeviceId],
        );
        if (latestTokenDoc) {
          const ownerId =
            latestTokenDoc.member?.id || latestTokenDoc.manager?.id;
          const isSameOwner = ownerId === decodedJwt.sub;
          const isLatestNotExpired =
            differenceInHours(
              new Date(),
              latestTokenDoc.accessExpirationDate,
            ) <= 0;

          if (
            isSameOwner &&
            isLatestNotExpired &&
            latestTokenDoc.accessToken &&
            latestTokenDoc.accessToken !== tokenToUse
          ) {
            const cookieName = latestTokenDoc.member
              ? CookieNames.MemberToken
              : CookieNames.ManagerToken;
            res.cookie(cookieName, latestTokenDoc.accessToken, cookieOptions);

            const refreshed = (await this.jwtService.verifyAsync(
              latestTokenDoc.accessToken,
              {
                secret: this.configService.get('JWT_ACCESS_SECRET'),
              },
            )) as { sub: string; iat: number; exp: number };

            return refreshed;
          }
        }
      }

      const newToken = await this.refreshToken(
        tokenToUse,
        req.cookies[CookieNames.DeviceId],
        res,
      );
      if (newToken) {
        const refreshed = (await this.jwtService.verifyAsync(newToken, {
          secret: this.configService.get('JWT_ACCESS_SECRET'),
        })) as { sub: string; iat: number; exp: number };

        return refreshed;
      }

      this.logger.warn(
        `Access token refresh failed. isMember=${isMember} deviceId=${req.cookies?.[CookieNames.DeviceId] || 'unknown'}`,
      );
      throw new UnauthorizedException('Unable to refresh token');
    }

    return decodedJwt;
  }

  async refreshToken(
    token: string,
    deviceId: string,
    res: Response,
  ): Promise<string | null> {
    try {
      const checkToken = await this.getAccessTokenByDeviceIdAndAccessToken(
        deviceId,
        token,
      );

      if (!checkToken) {
        this.logger.warn(
          `No token record found for device. deviceId=${deviceId || 'unknown'}`,
        );
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
          this.logger.warn(
            `Refresh token expired by date. deviceId=${deviceId || 'unknown'} refreshExpirationDate=${checkToken.refreshExpirationDate.toISOString()}`,
          );
          return null;
        }
        const { accessToken, accessExpirationDate } =
          await this.generateAccessToken(decodedJwt.sub);

        checkToken.accessToken = accessToken;
        checkToken.accessExpirationDate = accessExpirationDate;
        await this.tokenRepository.save(checkToken);

        // Set the new token in cookies
        const cookieName = checkToken.member
          ? CookieNames.MemberToken
          : CookieNames.ManagerToken;
        res.cookie(cookieName, accessToken, cookieOptions);

        return accessToken;
      }
      return null;
    } catch (error) {
      // Refresh token is also expired or invalid
      this.logger.warn(
        `Refresh flow failed. deviceId=${deviceId || 'unknown'} error=${(error as Error)?.message}`,
      );
      return null;
    }
  }
}
