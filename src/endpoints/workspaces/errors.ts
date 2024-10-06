import OperationError, {
  getErrorMessageFromParams,
  OperationErrorParameters,
} from '../../utils/OperationError.js';
import {kEndpointConstants} from '../constants.js';

export class WorkspaceExistsError extends OperationError {
  name = 'WorkspaceExistsError';
  statusCode = kEndpointConstants.httpStatusCode.conflict;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Workspace exists');
  }
}

export class WorkspaceRootnameExistsError extends OperationError {
  name = 'WorkspaceRootnameExistsError';
  statusCode = kEndpointConstants.httpStatusCode.conflict;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Workspace root name exists'
    );
  }
}
