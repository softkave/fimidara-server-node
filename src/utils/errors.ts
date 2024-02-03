import {endpointConstants} from '../endpoints/constants';
import OperationError, {
  getErrorMessageFromParams,
  OperationErrorParameters,
} from './OperationError';

export class ServerError extends OperationError {
  name = 'ServerError';
  statusCode = endpointConstants.httpStatusCode.serverError;

  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Server error');
  }
}

export class TimeoutError extends OperationError {
  name = 'TimeoutError';
  statusCode = endpointConstants.httpStatusCode.serverError;

  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Request timed out');
  }
}

export class ValidationError extends OperationError {
  name = 'ValidationError';
  statusCode = endpointConstants.httpStatusCode.badRequest;
}

export class ServerStateConflictError extends OperationError {
  name = 'ServerStateConflictError';
  statusCode = endpointConstants.httpStatusCode.conflict;
}

export class InternalError extends OperationError {
  name = 'InternalError';
  isPublicError = false;
  statusCode = endpointConstants.httpStatusCode.serverError;
}
