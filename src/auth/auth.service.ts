import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BadRequestException } from '../error/bad-request-error';
import { UnauthorizedException } from '../error/unauthorized-error';
import Token from '../token/token.model';
import { TokenService } from '../token/token.service';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { returnUser } from '../utils/helprt-functions';
import { LoginDto } from './dtos/request/login.dto';
import { RegisterDto } from './dtos/request/register.dto';
import { UserCreatedDto } from './dtos/response/user-created.dto';
@Injectable()
export class AuthService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectModel(Token.name)
    private readonly tokenRepository: Model<Token>,
  ) {}

  // Generate access and refresh tokens for a user on a specific device.
  generateTokens(user: User, deviceId: string) {
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
  async login(
    { email, password }: LoginDto,
    deviceId: string,
  ): Promise<UserCreatedDto> {
    const getUser = await this.userService.getUserByEmail(email);
    if (!getUser) {
      throw new BadRequestException('Wrong Email or Password');
    }
    const isPasswordValid = await getUser.comparePassword(password);
    if (!isPasswordValid) {
      throw new BadRequestException('Wrong Email or Password');
    }
    const generateTokens = await this.tokenService.generateTokens({
      userId: getUser.id,
      managerId: null,
      deviceId,
    });
    return { ...returnUser(getUser), token: generateTokens.accessToken };
  }

  async register(
    { email, name, password }: RegisterDto,
    deviceId: string,
  ): Promise<UserCreatedDto> {
    const checkEmail = await this.userService.getUserByEmail(email);
    if (checkEmail) {
      throw new BadRequestException('Email already exists');
    }
    const hashPass = await this.userService.hashPassword(password);
    const newUser = await this.userService.createUser({
      email,
      name,
      password: hashPass,
    });
    const generateTokens = await this.tokenService.generateTokens({
      userId: newUser.id,
      managerId: null,
      deviceId,
    });
    return { ...returnUser(newUser), token: generateTokens.accessToken };
  }

  async test() {
    this.userService.test();
    return 'test';
  }
  // Refresh tokens: Validate the refresh token and update tokens.
  async refreshToken(token: string, deviceId: string) {
    const tokenDoc = await this.tokenRepository.findOne({
      deviceId,
      accessToken: token,
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
    await tokenDoc.save();

    return {
      token: tokens.accessToken,
    };
  }

  async validateJwt(req: any) {
    const token = req.headers.authorization?.split(' ')[1];
    const getTokenFromDb = await this.tokenRepository.findOne({
      accessToken: token,
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
