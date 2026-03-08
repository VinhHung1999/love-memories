import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

type AsyncFn<P extends ParamsDictionary = ParamsDictionary, ReqBody = unknown, Q extends ParsedQs = ParsedQs> = (
  req: Request<P, unknown, ReqBody, Q>,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export function asyncHandler<P extends ParamsDictionary = ParamsDictionary, ReqBody = unknown, Q extends ParsedQs = ParsedQs>(
  fn: AsyncFn<P, ReqBody, Q>,
): RequestHandler<P, unknown, ReqBody, Q> {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
