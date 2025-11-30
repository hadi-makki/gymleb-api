import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Response } from 'express';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { MemberService } from 'src/member/member.service';
import { TokenService } from 'src/token/token.service';
import { CookieNames, cookieOptions } from 'src/utils/constants';
import { MediaService } from 'src/media/media.service';
import { UserEntity } from './user.entity';
import { Repository } from 'typeorm';
import {
  ReturnUserDto,
  ReturnUserWithTokenDto,
  ReturnUserMeDto,
} from './dto/return-user.dto';
import { UpdateUserTrainingPreferencesDto } from './dto/update-user-training-preferences.dto';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
    @InjectRepository(GymEntity)
    private readonly gymRepository: Repository<GymEntity>,
    private readonly tokenService: TokenService,
    private readonly mediaService: MediaService,
    @Inject(forwardRef(() => MemberService))
    private readonly memberService: MemberService,
  ) {}

  async findUserByPhone(
    phoneNumber: string,
    phoneNumberISOCode?: string,
  ): Promise<UserEntity | null> {
    return await this.userRepository.findOne({
      where: {
        phone: phoneNumber,
        ...(phoneNumberISOCode && { phoneNumberISOCode }),
      },
      relations: ['members'],
    });
  }

  async checkUserPasswordStatus(
    phoneNumber: string,
    phoneNumberISOCode?: string,
  ): Promise<{ hasPassword: boolean; message: string }> {
    const user = await this.findUserByPhone(phoneNumber, phoneNumberISOCode);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Load all members under this user
    const members = await this.memberRepository.find({
      where: { user: { id: user.id } },
      select: ['id', 'password'],
    });

    const hasPassword = members.some((member) => !!member.password);

    return {
      hasPassword,
      message: hasPassword
        ? 'Please enter your password'
        : 'Please set a password for your account',
    };
  }

  async setPasswordForAllMembers(
    userId: string,
    password: string,
  ): Promise<void> {
    const hashedPassword = await MemberEntity.hashPassword(password);

    const members = await this.memberRepository.find({
      where: { user: { id: userId } },
    });

    for (const member of members) {
      member.password = hashedPassword;
      await this.memberRepository.save(member);
    }
  }

  async validatePasswordAgainstMembers(
    userId: string,
    password: string,
  ): Promise<boolean> {
    const members = await this.memberRepository.find({
      where: { user: { id: userId } },
      select: ['id', 'password'],
    });

    for (const member of members) {
      if (member.password) {
        console.log('this is member password', member.password);
        const isMatch = await MemberEntity.isPasswordMatch(
          password,
          member.password,
        );
        if (isMatch) {
          return true;
        }
      }
    }

    return false;
  }

  async loginOrCreatePassword(
    phoneNumber: string,
    password: string,
    phoneNumberISOCode: string,
    deviceId: string,
    res: Response,
  ): Promise<ReturnUserWithTokenDto> {
    const user = await this.findUserByPhone(phoneNumber, phoneNumberISOCode);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Load all members to check if any have passwords
    const members = await this.memberRepository.find({
      where: { user: { id: user.id } },
      select: ['id', 'password'],
    });

    const hasAnyPassword = members.some((member) => !!member.password);

    if (!hasAnyPassword) {
      // No members have passwords, set password for all members
      await this.setPasswordForAllMembers(user.id, password);
    } else {
      console.log('this is password', password);
      // Members have passwords, validate against them
      const isValid = await this.validatePasswordAgainstMembers(
        user.id,
        password,
      );

      if (!isValid) {
        throw new BadRequestException('Invalid password');
      }
    }

    // Generate JWT token for user
    const token = await this.tokenService.generateTokens({
      userTokenId: user.id,
      deviceId,
    });

    // Set token in cookie
    res.cookie(CookieNames.UserToken, token.accessToken, cookieOptions);

    // Return user data with token
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      phoneNumberISOCode: user.phoneNumberISOCode,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      token: token.accessToken,
      deviceId,
    };
  }

  private async returnUser(user: UserEntity): Promise<ReturnUserDto> {
    const userWithRelations = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['profileImage'],
    });

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      phoneNumberISOCode: user.phoneNumberISOCode,
      profileImage: userWithRelations?.profileImage,
      trainingLevel: user.trainingLevel,
      trainingGoals: user.trainingGoals,
      trainingPreferences: user.trainingPreferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getUserGyms(userId: string): Promise<GymEntity[]> {
    // Get all members under this user with their gyms
    const members = await this.memberRepository.find({
      where: { user: { id: userId } },
      relations: ['gym'],
      select: {
        id: true,
        gym: {
          id: true,
          name: true,
          gymDashedName: true,
          address: true,
          googleMapsLink: true,
          email: true,
          phone: true,
          phoneNumberISOCode: true,
          description: true,
          gymType: true,
          allowUserSignUp: true,
          allowedUserResevationsPerSession: true,
          sessionTimeInHours: true,
          socialMediaLinks: true,
          openingDays: true,
          womensTimes: true,
          offers: true,
          showPersonalTrainers: true,
          restrictPublicProgramsToActiveMembers: true,
          isDeactivated: true,
          finishedPageSetup: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    });

    // Extract unique gyms (deduplicate by gym ID)
    const gymMap = new Map<string, GymEntity>();
    members.forEach((member) => {
      if (member.gym && !gymMap.has(member.gym.id)) {
        gymMap.set(member.gym.id, member.gym);
      }
    });

    return Array.from(gymMap.values());
  }

  async getMe(userId: string): Promise<ReturnUserMeDto> {
    // Get user with members and their gyms
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['members', 'profileImage'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Get all members with their gyms
    const members = await this.memberRepository.find({
      where: { user: { id: userId } },
      relations: ['gym'],
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneNumberISOCode: true,
        gender: true,
        gym: {
          id: true,
          name: true,
          gymDashedName: true,
          address: true,
          googleMapsLink: true,
          email: true,
          phone: true,
          phoneNumberISOCode: true,
          description: true,
          gymType: true,
          allowUserSignUp: true,
          allowedUserResevationsPerSession: true,
          sessionTimeInHours: true,
          socialMediaLinks: true,
          openingDays: true,
          womensTimes: true,
          offers: true,
          showPersonalTrainers: true,
          restrictPublicProgramsToActiveMembers: true,
          isDeactivated: true,
          finishedPageSetup: true,
          createdAt: true,
          updatedAt: true,
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get unique gyms
    const gyms = await this.getUserGyms(userId);

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      phoneNumberISOCode: user.phoneNumberISOCode,
      profileImage: user.profileImage,
      trainingLevel: user.trainingLevel,
      trainingGoals: user.trainingGoals,
      trainingPreferences: user.trainingPreferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      members: members.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        phoneNumberISOCode: member.phoneNumberISOCode,
        gender: member.gender,
        gym: member.gym,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      })),
      gyms,
    };
  }

  async updateName(userId: string, name: string): Promise<ReturnUserDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.name = name;
    await this.userRepository.save(user);

    return this.returnUser(user);
  }

  async updateProfileImage(
    userId: string,
    image: Express.Multer.File,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['members', 'profileImage'],
    });

    console.log('this is the user', user);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Get a manager ID from one of the user's members' gyms for media upload
    // This is needed for MediaService.upload
    const memberWithGym = await this.memberRepository.findOne({
      where: { user: { id: userId } },
      relations: ['gym', 'gym.owner'],
    });

    if (!memberWithGym || !memberWithGym.gym || !memberWithGym.gym.owner) {
      throw new BadRequestException(
        'Cannot update profile image: user has no members with gyms',
      );
    }

    const managerId = memberWithGym.gym.owner.id;

    if (image) {
      console.log('before deleting old profile image');
      // Delete old profile image if exists
      if (user.profileImage) {
        await this.mediaService.delete(user.profileImage.id);
      }

      console.log('after deleting old profile image');

      // Upload new image
      const imageData = await this.mediaService.upload(image, managerId);
      user.profileImage = imageData;
      await this.userRepository.save(user);

      // Sync profile image to all members under this user
      const members = await this.memberRepository.find({
        where: { user: { id: userId } },
        relations: ['profileImage'],
      });

      console.log('this is the members', members);

      for (const member of members) {
        // Delete old member profile image if exists
        if (member.profileImage) {
          await this.mediaService.delete(member.profileImage.id);
        }
        member.profileImage = imageData;
        await this.memberRepository.save(member);
      }
    } else {
      // Remove profile image
      if (user.profileImage) {
        await this.mediaService.delete(user.profileImage.id);
      }
      user.profileImage = null;
      await this.userRepository.save(user);

      // Remove profile image from all members
      const members = await this.memberRepository.find({
        where: { user: { id: userId } },
        relations: ['profileImage'],
      });

      for (const member of members) {
        if (member.profileImage) {
          await this.mediaService.delete(member.profileImage.id);
        }
        member.profileImage = null;
        await this.memberRepository.save(member);
      }
    }

    return { message: 'Profile image updated successfully' };
  }

  async updateTrainingPreferences(
    userId: string,
    updateDto: UpdateUserTrainingPreferencesDto,
  ): Promise<{ message: string; user: ReturnUserDto }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Update user training preferences
    if (updateDto.trainingLevel !== undefined) {
      user.trainingLevel = updateDto.trainingLevel;
    }
    if (updateDto.trainingGoals !== undefined) {
      user.trainingGoals = updateDto.trainingGoals;
    }
    if (updateDto.trainingPreferences !== undefined) {
      user.trainingPreferences = updateDto.trainingPreferences;
    }

    await this.userRepository.save(user);

    // Sync training preferences to all members under this user
    const members = await this.memberRepository.find({
      where: { user: { id: userId } },
    });

    for (const member of members) {
      if (updateDto.trainingLevel !== undefined) {
        member.trainingLevel = updateDto.trainingLevel;
      }
      if (updateDto.trainingGoals !== undefined) {
        member.trainingGoals = updateDto.trainingGoals;
      }
      if (updateDto.trainingPreferences !== undefined) {
        member.trainingPreferences = updateDto.trainingPreferences;
      }
      await this.memberRepository.save(member);
    }

    return {
      message: 'Training preferences updated successfully',
      user: await this.returnUser(user),
    };
  }

  async getMemberProfile(userId: string, memberId: string): Promise<any> {
    // Verify that the member belongs to this user
    const member = await this.memberRepository.findOne({
      where: { id: memberId, user: { id: userId } },
    });

    if (!member) {
      throw new NotFoundException(
        'Member not found or does not belong to this user',
      );
    }

    // Use MemberService to get the full member profile
    return await this.memberService.getMe(memberId);
  }
}
