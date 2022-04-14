import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from '../../utilities/OperationError';
import {endpointConstants} from '../constants';

export class FileExistsError extends OperationError {
  public name = 'FileExistsError';
  public statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'File exists');
  }
}

export class FileDoesNotExistError extends OperationError {
  public name = 'FileDoesNotExistError';
  public statusCode = endpointConstants.httpStatusCode.notFound;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'File not found');
  }
}
