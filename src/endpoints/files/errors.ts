import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from '../../utils/OperationError';
import {endpointConstants} from '../constants';

export class FileExistsError extends OperationError {
  name = 'FileExistsError';
  statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'File exists');
  }
}

export class FileDoesNotExistError extends OperationError {
  name = 'FileDoesNotExistError';
  statusCode = endpointConstants.httpStatusCode.notFound;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'File not found');
  }
}
