import OperationError, {
  getErrorMessageFromParams,
  OperationErrorParameters,
} from '../../utils/OperationError';
import {kEndpointConstants} from '../constants';

export class PermissionGroupExistsError extends OperationError {
  name = 'PermissionGroupExistsError';
  statusCode = kEndpointConstants.httpStatusCode.conflict;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Permission group exists');
  }
}

export class PermissionGroupDoesNotExistError extends OperationError {
  name = 'PermissionGroupDoesNotExistError';
  statusCode = kEndpointConstants.httpStatusCode.notFound;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Permission group not found');
  }
}
