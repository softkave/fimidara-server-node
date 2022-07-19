import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from '../../utilities/OperationError';
import {endpointConstants} from '../constants';

export class WorkspaceExistsError extends OperationError {
  name = 'WorkspaceExistsError';
  statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Workspace exists');
  }
}

export class WorkspaceRootnameExistsError extends OperationError {
  name = 'WorkspaceRootnameExistsError';
  statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Workspace root name exists'
    );
  }
}

export class WorkspaceDoesNotExistError extends OperationError {
  name = 'WorkspaceDoesNotExistError';
  statusCode = endpointConstants.httpStatusCode.notFound;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Workspace not found');
  }
}
