import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  ILike,
  LessThan,
  Repository,
} from 'typeorm';
import { RequestLogEntity, ResolveStatus } from './request-log.entity';
import { FilterOperator, PaginateQuery, paginate } from 'nestjs-paginate';

@Injectable()
export class RequestLogsService {
  constructor(
    @InjectRepository(RequestLogEntity)
    private readonly repo: Repository<RequestLogEntity>,
  ) {}

  async create(log: Partial<RequestLogEntity>) {
    const entity = this.repo.create(log);
    return this.repo.save(entity);
  }

  async findAll(query: PaginateQuery, startDate?: string, endDate?: string) {
    const where: FindOptionsWhere<RequestLogEntity> | null = null;
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }
    console.log('this is the where', where);
    const result = await paginate(query, this.repo, {
      sortableColumns: ['createdAt', 'durationMs', 'statusCode'],
      defaultSortBy: [['createdAt', 'DESC']],
      searchableColumns: ['url', 'method', 'ip', 'city', 'country'],
      filterableColumns: {
        statusCode: [FilterOperator.EQ, FilterOperator.GTE, FilterOperator.LTE],
        isError: [FilterOperator.EQ],
        isSlow: [FilterOperator.EQ],
      },

      ...(where && { where }),
    });
    return result;
  }

  async findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async deleteOlderThan(date: Date) {
    await this.repo.delete({ createdAt: LessThan(date) });
  }

  async updateResolveStatus(id: string, resolveStatus: ResolveStatus) {
    const result = await this.repo.update(id, { resolveStatus });
    if (result.affected === 0) {
      throw new NotFoundException('Request log not found');
    }
    return { message: 'Resolve status updated successfully' };
  }
}
