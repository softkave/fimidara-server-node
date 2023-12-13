import OperationError, {
  getErrorMessageFromParams,
  OperationErrorParameters,
} from '../../utils/OperationError';
import {endpointConstants} from '../constants';

export class FileExistsError extends OperationError {
  name = 'FileExistsError';
  statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'File exists.');
  }
}

export class FileNotWritableError extends OperationError {
  name = 'FileNotWritableError';
  statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'File not in a writable state. ' +
        'This is most likely because the file is currently being written to.'
    );
  }
}

export class InvalidMatcherError extends OperationError {
  name = 'InvalidMatcherError';
  statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Invalid matcher.');
  }
}

export class ProvideNamepathError extends OperationError {
  name = 'ProvideNamepathError';
  statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Provide a namepath.');
  }
}
