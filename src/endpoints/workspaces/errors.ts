import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from '../../utilities/OperationError';
import {endpointConstants} from '../constants';

export class WorkspaceExistsError extends OperationError {
  public name = 'WorkspaceExistsError';
  public statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Workspace exists');
  }
}

export class WorkspaceDoesNotExistError extends OperationError {
  public name = 'WorkspaceDoesNotExistError';
  public statusCode = endpointConstants.httpStatusCode.notFound;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Workspace not found');
  }
}
