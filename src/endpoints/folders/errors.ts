import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from '../../utilities/OperationError';
import {endpointConstants} from '../constants';

export class FolderExistsError extends OperationError {
  public name = 'FolderExistsError';
  public statusCode = endpointConstants.httpStatusCode.badRequest;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Folder exists');
  }
}

export class FolderNotFoundError extends OperationError {
  public name = 'FolderNotFoundError';
  public statusCode = endpointConstants.httpStatusCode.badRequest;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Folder not found');
  }
}
