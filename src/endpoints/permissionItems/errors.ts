import OperationError, {
  getErrorMessageFromParams,
  OperationErrorParameters,
} from '../../utils/OperationError.js';
import {kEndpointConstants} from '../constants.js';

export class PermissionItemExistsError extends OperationError {
  name = 'PermissionItemExistsError';
  statusCode = kEndpointConstants.httpStatusCode.conflict;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Permission item exists');
  }
}

export class PermissionItemDoesNotExistError extends OperationError {
  name = 'PermissionItemDoesNotExistError';
  statusCode = kEndpointConstants.httpStatusCode.notFound;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Permission item not found');
  }
}
