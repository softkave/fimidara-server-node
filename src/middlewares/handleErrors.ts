import {Response} from 'express';
import {JsonWebTokenError, NotBeforeError, TokenExpiredError} from 'jsonwebtoken';
import {kEndpointConstants} from '../endpoints/constants';
import {kUtilsInjectables} from '../endpoints/contexts/injection/injectables';
import {
  CredentialsExpiredError,
  InvalidCredentialsError,
} from '../endpoints/users/errors';
import {getPublicErrors} from '../endpoints/utils';
import {ServerError} from '../utils/errors';

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

function getArg(name: 'err' | 'req' | 'res' | 'next', args: unknown[]) {
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

function handleErrors(...args: unknown[]) {
  const err = getArg('err', args) as Error | undefined;
  // const req: Request = getArg('req', args);
  const res = getArg('res', args) as Response;

  if (!err) {
    res.status(kEndpointConstants.httpStatusCode.serverError).send({
      errors: getPublicErrors([new ServerError()]),
    });

    return;
  }

  kUtilsInjectables.logger().error(err);
  const JWTError = resolveJWTError(err);
  if (JWTError) {
    res.status(kEndpointConstants.httpStatusCode.unauthorized).json({
      errors: getPublicErrors([JWTError]),
    });
  } else {
    res.status(kEndpointConstants.httpStatusCode.serverError).json({
      errors: getPublicErrors([new ServerError()]),
    });
  }
}

export default handleErrors;
