import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async ping(): Promise<string> {
    return this.redis.ping();
  }

  async setTestKey(key: string, value: string): Promise<'OK'> {
    return this.redis.set(key, value, 'EX', 60);
  }

  async getKey(key: string): Promise<string | null> {
    return this.redis.get(key);
  }
}
