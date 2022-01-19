import OperationError from '../utilities/OperationError';

export class InvalidRequestError extends OperationError {
  public name = 'InvalidRequestError';
  public message = 'Request is invalid';
}

export class RateLimitError extends OperationError {
  public name = 'RateLimitError';
  public message = 'Rate limit in progress, please try again later';
}

export class MalformedRequestError extends OperationError {
  public name = 'MalformedRequestError';
  public message = 'Provided input is malformed';
}

export class ExpiredError extends OperationError {
  public name = 'ExpiredError';
  public message = 'Resource has expired';
}

export class NotFoundError extends OperationError {
  public name = 'NotFoundError';
  public message = 'Resource does not exist';
}

export class ResourceExistsError extends OperationError {
  public name = 'ResourceExistsError';
  public message = 'Resource exist';
}
