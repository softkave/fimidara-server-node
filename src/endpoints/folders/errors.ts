import OperationError from '../../utilities/OperationError';

export class FolderExistsError extends OperationError {
  public name = 'FolderExistsError';
  public message = 'Folder exists';
}

export class FolderDoesNotExistError extends OperationError {
  public name = 'FolderDoesNotExistError';
  public message = 'Folder does not exist';
}
