import {Response} from 'express';
import {JsonWebTokenError, NotBeforeError, TokenExpiredError} from 'jsonwebtoken';
import {endpointConstants} from '../endpoints/constants';
import {CredentialsExpiredError, InvalidCredentialsError} from '../endpoints/users/errors';
import {getPublicErrors} from '../endpoints/utils';
import {ServerError} from '../utils/errors';
import {serverLogger} from '../utils/logger/loggerUtils';

export function resolveJWTError(err: Error) {
  switch (err.name) {
    case JsonWebTokenError.name:
    case 'UnauthorizedError':

    // TODO: should this be resolved as invalid?
    // eslint-disable-next-line no-fallthrough
    case NotBeforeError.name:
      return new InvalidCredentialsError();

    case TokenExpiredError.name:
      return new CredentialsExpiredError();

    default:
      return undefined;
  }
}

function getArg(name: 'err' | 'req' | 'res' | 'next', args: any[]) {
  switch (name) {
    case 'err':
      return args.length === 4 ? args[0] : undefined;
    case 'req':
      return args.length === 4 ? args[1] : args[0];
    case 'res':
      return args.length === 4 ? args[2] : args[1];
    case 'next':
      return args.length === 4 ? args[3] : args[2];
  }
}

function handleErrors(...args: any[]) {
  const err = getArg('err', args) as Error | undefined;
  // const req: Request = getArg('req', args);
  const res: Response = getArg('res', args);

  if (!err) {
    res.status(endpointConstants.httpStatusCode.serverError).send({
      errors: [new ServerError()],
    });

    return;
  }

  serverLogger.error(err);
  const JWTError = resolveJWTError(err);
  if (JWTError) {
    res.status(endpointConstants.httpStatusCode.unauthorized).json({
      errors: getPublicErrors([JWTError]),
    });
  } else {
    res.status(endpointConstants.httpStatusCode.serverError).json({
      errors: getPublicErrors([new ServerError()]),
    });
  }
}

export default handleErrors;
