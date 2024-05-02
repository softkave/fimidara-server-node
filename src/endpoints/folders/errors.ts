import OperationError, {
  getErrorMessageFromParams,
  OperationErrorParameters,
} from '../../utils/OperationError.js';
import {kEndpointConstants} from '../constants.js';

export class FolderExistsError extends OperationError {
  name = 'FolderExistsError';
  statusCode = kEndpointConstants.httpStatusCode.conflict;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Folder exists');
  }
}

export class FolderNotFoundError extends OperationError {
  name = 'FolderNotFoundError';
  statusCode = kEndpointConstants.httpStatusCode.notFound;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Folder not found');
  }
}
