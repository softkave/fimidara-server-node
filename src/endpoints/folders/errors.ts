import OperationError from '../../utilities/OperationError';

export class FolderExistsError extends OperationError {
  public name = 'FolderExistsError';
  public message = 'Folder exists';
}

export class FolderNotFoundError extends OperationError {
  public name = 'FolderNotFoundError';
  public message = 'Folder not found';
}
