import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from './OperationError';

export class ServerError extends OperationError {
  public name = 'ServerError';

  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Server error');
  }
}

export class ValidationError extends OperationError {
  public name = 'ValidationError';
}

export class InternalError extends OperationError {
  public name = 'InternalError';
  public isPublic = false;
}
