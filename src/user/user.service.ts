import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { RegisterDto } from '../auth/dtos/request/register.dto';
import { User } from './user.model';
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userRepository: Model<User>,
  ) {}
  async hashPassword(password: string): Promise<string> {
    const hash = await bcrypt.hash(password, 10);
    return hash;
  }
  async getUserByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne({ email });
  }

  async createUser(data: RegisterDto) {
    return await this.userRepository.create(data);
  }

  async checkUserExists(id: string) {
    return await this.userRepository.exists({ id });
  }

  async getUserById(id: string) {
    return await this.userRepository.findById(id);
  }

  async test() {
    return 'test';
  }
}
