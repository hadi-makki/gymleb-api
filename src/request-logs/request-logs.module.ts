import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestLogEntity } from './request-log.entity';
import { RequestLogsService } from './request-logs.service';
import { RequestLogsController } from './request-logs.controller';
import { AuthenticationModule } from 'src/common/AuthModule.module';

@Module({
  imports: [TypeOrmModule.forFeature([RequestLogEntity]), AuthenticationModule],
  providers: [RequestLogsService],
  controllers: [RequestLogsController],
  exports: [RequestLogsService, TypeOrmModule],
})
export class RequestLogsModule {}
