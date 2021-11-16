import OperationError from '../../utilities/OperationError';

export class PermissionItemExistsError extends OperationError {
  public name = 'PermissionItemExistsError';
  public message = 'Permission item exists';
}

export class PermissionItemDoesNotExistError extends OperationError {
  public name = 'PermissionItemDoesNotExistError';
  public message = 'Permission item does not exist';
}
