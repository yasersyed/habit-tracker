import { query } from 'express-validator';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export const paginationQueryValidators = [
  query('page').optional().isInt({ min: 1 }).withMessage('Invalid page').toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: MAX_LIMIT })
    .withMessage('Invalid limit')
    .toInt()
];

export function parsePaginationQuery(req) {
  const page = req.query.page || DEFAULT_PAGE;
  const limit = req.query.limit || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function setPaginationHeaders(res, total, page, limit) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  res.set({
    'X-Total-Count': String(total),
    'X-Page': String(page),
    'X-Page-Size': String(limit),
    'X-Total-Pages': String(totalPages)
  });
}
