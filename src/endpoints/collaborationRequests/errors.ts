import OperationError, {
  IOperationErrorParameters,
} from '../../utilities/OperationError';

export class CollaborationRequestExistsError extends OperationError {
  public name = 'CollaborationRequestExistsError';
  public message = 'Collaboration request exists';
  public email: string;

  constructor(params: IOperationErrorParameters & {email: string}) {
    super(params);
    this.email = params.email;
  }
}

export class CollaboratorExistsError extends OperationError {
  public name = 'CollaboratorExistsError';
  public message = 'Collaborator exists';
  public email: string;

  constructor(params: IOperationErrorParameters & {email: string}) {
    super(params);
    this.email = params.email;
  }
}

export class CollaborationRequestDoesNotExistError extends OperationError {
  public name = 'CollaborationRequestDoesNotExistError';
  public message = 'Collaboration request does not exist';
}
