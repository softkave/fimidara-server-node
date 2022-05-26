import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from '../utilities/OperationError';
import {endpointConstants} from './constants';

export class InvalidRequestError extends OperationError {
  public name = 'InvalidRequestError';
  public statusCode = endpointConstants.httpStatusCode.badRequest;

  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Request is invalid');
  }
}

export class RateLimitError extends OperationError {
  public name = 'RateLimitError';
  public statusCode = endpointConstants.httpStatusCode.tooManyRequests;

  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Rate limit in progress, please try again later'
    );
  }
}

export class ExpiredError extends OperationError {
  public name = 'ExpiredError';
  public statusCode = endpointConstants.httpStatusCode.forbidden;

  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Resource has expired');
  }
}

export class NotFoundError extends OperationError {
  public name = 'NotFoundError';
  public statusCode = endpointConstants.httpStatusCode.notFound;

  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Resource not found');
  }
}

export class ResourceExistsError extends OperationError {
  public name = 'ResourceExistsError';
  public statusCode = endpointConstants.httpStatusCode.conflict;

  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Resource exist');
  }
}
