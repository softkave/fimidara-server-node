import OperationError, {
  getErrorMessageFromParams,
  OperationErrorParameters,
} from '../utils/OperationError.js';
import {kEndpointConstants} from './constants.js';

export class InvalidRequestError extends OperationError {
  name = 'InvalidRequestError';
  statusCode = kEndpointConstants.httpStatusCode.badRequest;

  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Request is invalid');
  }
}

export class InvalidStateError extends OperationError {
  name = 'InvalidStateError';
  statusCode = kEndpointConstants.httpStatusCode.conflict;

  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'A resource involved in processing the request is in an invalid state'
    );
  }
}

export class ResourceLockedError extends InvalidStateError {
  name = 'ResourceLockedError';

  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Resource is locked by another consumer'
    );
  }
}

export class RateLimitError extends OperationError {
  name = 'RateLimitError';
  statusCode = kEndpointConstants.httpStatusCode.tooManyRequests;

  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Rate limit in progress, please try again later'
    );
  }
}

export class ExpiredError extends OperationError {
  name = 'ExpiredError';
  statusCode = kEndpointConstants.httpStatusCode.forbidden;

  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Resource has expired');
  }
}

export class NotFoundError extends OperationError {
  name = 'NotFoundError';
  statusCode = kEndpointConstants.httpStatusCode.notFound;

  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Resource not found');
  }
}

export class ResourceExistsError extends OperationError {
  name = 'ResourceExistsError';
  statusCode = kEndpointConstants.httpStatusCode.conflict;

  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Resource exist');
  }
}
