import OperationError, {
  getErrorMessageFromParams,
  OperationErrorParameters,
} from '../utils/OperationError';
import {endpointConstants} from './constants';

export class InvalidRequestError extends OperationError {
  name = 'InvalidRequestError';
  statusCode = endpointConstants.httpStatusCode.badRequest;

  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Request is invalid.');
  }
}

export class RateLimitError extends OperationError {
  name = 'RateLimitError';
  statusCode = endpointConstants.httpStatusCode.tooManyRequests;

  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Rate limit in progress, please try again later.'
    );
  }
}

export class ExpiredError extends OperationError {
  name = 'ExpiredError';
  statusCode = endpointConstants.httpStatusCode.forbidden;

  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Resource has expired.');
  }
}

export class NotFoundError extends OperationError {
  name = 'NotFoundError';
  statusCode = endpointConstants.httpStatusCode.notFound;

  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Resource not found.');
  }
}

export class ResourceExistsError extends OperationError {
  name = 'ResourceExistsError';
  statusCode = endpointConstants.httpStatusCode.conflict;

  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Resource exist.');
  }
}
