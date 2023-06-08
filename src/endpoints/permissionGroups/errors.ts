import OperationError, {
  getErrorMessageFromParams,
  OperationErrorParameters,
} from '../../utils/OperationError';
import {endpointConstants} from '../constants';

export class PermissionGroupExistsError extends OperationError {
  name = 'PermissionGroupExistsError';
  statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Permission group exists.');
  }
}

export class PermissionGroupDoesNotExistError extends OperationError {
  name = 'PermissionGroupDoesNotExistError';
  statusCode = endpointConstants.httpStatusCode.notFound;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Permission group not found.');
  }
}
