// Wraps an async Express handler so rejected promises reach the error
// middleware instead of becoming unhandled rejections (Express 4 doesn't
// await handlers itself).
import type { NextFunction, Request, RequestHandler, Response } from 'express'

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}
