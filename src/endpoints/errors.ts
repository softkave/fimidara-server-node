import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from '../utilities/OperationError';

export class InvalidRequestError extends OperationError {
  public name = 'InvalidRequestError';

  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Request is invalid');
  }
}

export class RateLimitError extends OperationError {
  public name = 'RateLimitError';

  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Rate limit in progress, please try again later'
    );
  }
}

export class MalformedRequestError extends OperationError {
  public name = 'MalformedRequestError';

  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Provided input is malformed'
    );
  }
}

export class ExpiredError extends OperationError {
  public name = 'ExpiredError';

  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Resource has expired');
  }
}

export class NotFoundError extends OperationError {
  public name = 'NotFoundError';

  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Resource does not exist');
  }
}

export class ResourceExistsError extends OperationError {
  public name = 'ResourceExistsError';

  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Resource exist');
  }
}
