import {Request, Response} from 'express';
import pkg from 'jsonwebtoken';
import {isObject} from 'lodash-es';
import {AnyFn, AnyObject} from 'softkave-js-utils';
import {kIjxUtils} from '../contexts/ijx/injectables.js';
import {kEndpointConstants} from '../endpoints/constants.js';
import {
  CredentialsExpiredError,
  InvalidCredentialsError,
} from '../endpoints/users/errors.js';
import {getPublicErrors} from '../endpoints/utils.js';
import {ServerError} from '../utils/errors.js';

const {JsonWebTokenError, NotBeforeError, TokenExpiredError} = pkg;

export function resolveJWTError(err: unknown) {
  if (!isObject(err)) {
    return undefined;
  }

  switch ((err as AnyObject).name) {
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

export function handleErrors(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: AnyFn
) {
  if (!err) {
    res.status(kEndpointConstants.httpStatusCode.serverError).send({
      errors: getPublicErrors([new ServerError()]),
    });

    return;
  }

  kIjxUtils.logger().error(err);
  const JWTError = resolveJWTError(err);
  if (JWTError) {
    res.status(kEndpointConstants.httpStatusCode.unauthorized).json({
      errors: getPublicErrors(JWTError),
    });
  } else {
    res.status(kEndpointConstants.httpStatusCode.serverError).json({
      errors: getPublicErrors(new ServerError()),
    });
  }
}

export function handleNotFound(req: Request, res: Response) {
  res.status(404).send('Not found');
}
