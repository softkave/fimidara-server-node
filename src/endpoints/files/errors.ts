import OperationError, {
  getErrorMessageFromParams,
  OperationErrorParameters,
} from '../../utils/OperationError';
import {kEndpointConstants} from '../constants';

export class FileExistsError extends OperationError {
  name = 'FileExistsError';
  statusCode = kEndpointConstants.httpStatusCode.conflict;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'File exists');
  }
}

export class FileNotWritableError extends OperationError {
  name = 'FileNotWritableError';
  statusCode = kEndpointConstants.httpStatusCode.conflict;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'File not in a writable state. ' +
        'This is most likely because the file is currently being written to'
    );
  }
}
