import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RedisService } from './redis.service';

@ApiTags('Redis')
@Controller('redis')
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  @Get('ping')
  @ApiOperation({
    summary: 'Ping Redis server',
    description:
      'Tests the connection to the Redis server by sending a PING command. Returns PONG if the connection is successful.',
  })
  @ApiResponse({
    status: 200,
    description: 'Redis server responded successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        redis: { type: 'string', example: 'PONG' },
      },
    },
  })
  async ping() {
    const result = await this.redisService.ping();
    return { status: 'ok', redis: result };
  }

  @Post('test')
  @ApiOperation({
    summary: 'Set a test key in Redis',
    description:
      'Sets a test key (nest:redis:test) in Redis with the value "ok" and an expiration time of 60 seconds. Useful for testing Redis write operations.',
  })
  @ApiResponse({
    status: 200,
    description: 'Test key set successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
      },
    },
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string', example: 'nest:redis:test' },
        value: { type: 'string', example: 'ok' },
      },
    },
  })
  async setTestKey(@Body() body: { key: string; value: string }) {
    await this.redisService.setTestKey(body.key, body.value);
    return { status: 'ok' };
  }

  @Post('get')
  @ApiOperation({
    summary: 'Get the test key from Redis',
    description:
      'Retrieves the test key (nest:redis:test) from Redis. Returns the value if the key exists, or null if it has expired or does not exist.',
  })
  @ApiResponse({
    status: 200,
    description: 'Test key retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string', example: 'nest:redis:test' },
        value: { type: 'string', nullable: true, example: 'ok' },
      },
    },
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string', example: 'nest:redis:test' },
      },
    },
  })
  async getKey(@Body() body: { key: string }) {
    const value = await this.redisService.getKey(body.key);
    return { key: body.key, value };
  }
}
