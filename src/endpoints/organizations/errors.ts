import OperationError from '../../utilities/OperationError';

export class OrganizationExistsError extends OperationError {
  public name = 'OrganizationExistsError';
  public message = 'Organization exists';
}

export class OrganizationDoesNotExistError extends OperationError {
  public name = 'OrganizationDoesNotExistError';
  public message = 'Organization does not exist';
}
