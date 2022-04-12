import {endpointConstants} from '../endpoints/constants';
import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from './OperationError';

export class ServerError extends OperationError {
  public name = 'ServerError';
  public statusCode = endpointConstants.httpStatusCode.badRequest;

  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Server error');
  }
}

export class ValidationError extends OperationError {
  public name = 'ValidationError';
  public statusCode = endpointConstants.httpStatusCode.badRequest;
}

export class ServerStateConflictError extends OperationError {
  public name = 'ServerStateConflictError';
  public statusCode = endpointConstants.httpStatusCode.badRequest;
}

export class InternalError extends OperationError {
  public name = 'InternalError';
  public isPublicError = false;
  public statusCode = endpointConstants.httpStatusCode.badRequest;
}
