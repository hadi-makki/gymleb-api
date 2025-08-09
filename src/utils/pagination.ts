import { FilterQuery, Model, PopulateOptions, ProjectionType } from 'mongoose';

export interface PaginationParams<TDocument, TResult = TDocument> {
  filter?: FilterQuery<TDocument>;
  projection?: ProjectionType<TDocument> | null;
  populate?: PopulateOptions | PopulateOptions[];
  sort?: Record<string, 1 | -1>;
  page?: number;
  limit?: number;
  lean?: boolean;
  transform?: (doc: TDocument) => Promise<TResult> | TResult;
}

export interface PaginatedResult<TResult> {
  items: TResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export async function paginateModel<TDocument, TResult = TDocument>(
  model: Model<TDocument>,
  params: PaginationParams<TDocument, TResult>,
): Promise<PaginatedResult<TResult>> {
  const {
    filter = {},
    projection = null,
    populate,
    sort = { createdAt: -1 },
    page = 1,
    limit = 20,
    lean = false,
    transform,
  } = params;

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const skip = (safePage - 1) * safeLimit;

  const [total, docs] = await Promise.all([
    model.countDocuments(filter),
    model
      .find(filter, projection)
      .sort(sort)
      .skip(skip)
      .limit(safeLimit)
      .populate(populate)
      .lean(lean)
      .exec(),
  ]);

  const items: TResult[] = transform
    ? await Promise.all(docs.map((d) => transform(d as TDocument)))
    : (docs as TResult[]);

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
