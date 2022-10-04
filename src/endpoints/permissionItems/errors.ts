import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from '../../utilities/OperationError';
import {endpointConstants} from '../constants';

export class PermissionItemExistsError extends OperationError {
  name = 'PermissionItemExistsError';
  statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Permission item exists');
  }
}

export class PermissionItemDoesNotExistError extends OperationError {
  name = 'PermissionItemDoesNotExistError';
  statusCode = endpointConstants.httpStatusCode.notFound;
  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Permission item not found'
    );
  }
}
