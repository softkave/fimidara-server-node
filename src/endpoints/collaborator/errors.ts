import OperationError, {
  IOperationErrorParameters,
} from '../../utilities/OperationError';

export class CollaboratorExistsError extends OperationError {
  public name = 'CollaboratorExistsError';
  public message = 'Collaborator exists';
  public email: string;

  constructor(params: IOperationErrorParameters & {email: string}) {
    super(params);
    this.email = params.email;
  }
}

export class CollaboratorDoesNotExistError extends OperationError {
  public name = 'CollaboratorDoesNotExistError';
  public message = 'Collaborator does not exist';
}
