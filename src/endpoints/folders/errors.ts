import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from '../../utils/OperationError';
import {endpointConstants} from '../constants';

export class FolderExistsError extends OperationError {
  name = 'FolderExistsError';
  statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Folder exists');
  }
}

export class FolderNotFoundError extends OperationError {
  name = 'FolderNotFoundError';
  statusCode = endpointConstants.httpStatusCode.notFound;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Folder not found');
  }
}
