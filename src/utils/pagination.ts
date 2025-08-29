import {
  Repository,
  SelectQueryBuilder,
  FindOptionsWhere,
  FindOptionsOrder,
} from 'typeorm';

export interface PaginationParams<TEntity, TResult = TEntity> {
  filter?: FindOptionsWhere<TEntity>;
  order?: FindOptionsOrder<TEntity>;
  relations?: string[];
  page?: number;
  limit?: number;
  transform?: (entity: TEntity) => Promise<TResult> | TResult;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export async function paginateRepository<TEntity, TResult = TEntity>(
  repository: Repository<TEntity>,
  params: PaginationParams<TEntity, TResult>,
): Promise<PaginatedResult<TResult>> {
  const {
    filter = {},
    order = { createdAt: 'DESC' } as any,
    relations = [],
    page = 1,
    limit = 20,
    transform,
  } = params;

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const skip = (safePage - 1) * safeLimit;

  // Create query builder
  const queryBuilder = repository.createQueryBuilder('entity');

  // Add relations
  relations.forEach((relation) => {
    queryBuilder.leftJoinAndSelect(`entity.${relation}`, relation);
  });

  // Add where conditions
  if (Object.keys(filter).length > 0) {
    Object.entries(filter).forEach(([key, value], index) => {
      if (value !== undefined && value !== null) {
        if (index === 0) {
          queryBuilder.where(`entity.${key} = :${key}`, { [key]: value });
        } else {
          queryBuilder.andWhere(`entity.${key} = :${key}`, { [key]: value });
        }
      }
    });
  }

  // Add order by
  Object.entries(order).forEach(([key, direction]) => {
    queryBuilder.addOrderBy(`entity.${key}`, direction as 'ASC' | 'DESC');
  });

  // Get total count
  const total = await queryBuilder.getCount();

  // Get paginated results
  const entities = await queryBuilder.skip(skip).take(safeLimit).getMany();

  // Transform results if needed
  const items: TResult[] = transform
    ? await Promise.all(entities.map((entity) => transform(entity)))
    : (entities as unknown as TResult[]);

  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}

// Alternative simpler version using findAndCount
export async function paginateRepositorySimple<TEntity, TResult = TEntity>(
  repository: Repository<TEntity>,
  params: PaginationParams<TEntity, TResult>,
): Promise<PaginatedResult<TResult>> {
  const {
    filter = {},
    order = { createdAt: 'DESC' } as any,
    relations = [],
    page = 1,
    limit = 20,
    transform,
  } = params;

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const skip = (safePage - 1) * safeLimit;

  const [entities, total] = await repository.findAndCount({
    where: filter,
    order,
    relations,
    skip,
    take: safeLimit,
  });

  // Transform results if needed
  const items: TResult[] = transform
    ? await Promise.all(entities.map((entity) => transform(entity)))
    : (entities as unknown as TResult[]);

  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}

// Advanced version with custom query builder support
export async function paginateQueryBuilder<TEntity, TResult = TEntity>(
  queryBuilder: SelectQueryBuilder<TEntity>,
  params: {
    page?: number;
    limit?: number;
    transform?: (entity: TEntity) => Promise<TResult> | TResult;
  },
): Promise<PaginatedResult<TResult>> {
  const { page = 1, limit = 20, transform } = params;

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const skip = (safePage - 1) * safeLimit;

  // Clone the query builder to avoid modifying the original
  const countQueryBuilder = queryBuilder.clone();
  const dataQueryBuilder = queryBuilder.clone();

  // Get total count
  const total = await countQueryBuilder.getCount();

  // Get paginated results
  const entities = await dataQueryBuilder.skip(skip).take(safeLimit).getMany();

  // Transform results if needed
  const items: TResult[] = transform
    ? await Promise.all(entities.map((entity) => transform(entity)))
    : (entities as unknown as TResult[]);

  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}
