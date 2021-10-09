import {NextFunction, Request, Response} from 'express';

function httpToHttps(req: Request, res: Response, next: NextFunction) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }

  return next();
}

export default httpToHttps;
