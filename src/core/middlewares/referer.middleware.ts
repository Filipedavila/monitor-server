import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RefererMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const allowedReferer = process.env.REFERER;
    if (!allowedReferer) {
      return next();
    }

    const clientReferer = req.headers.referer;
    try {
      if (clientReferer) {
        const refererUrl = new URL(clientReferer);
        const allowedUrl = new URL(allowedReferer);

        if (refererUrl.origin === allowedUrl.origin) {
          return next(); 
        }
      }
    } catch (e) {

    }

    throw new ForbiddenException('Access denied: Invalid Referer');
  }
}