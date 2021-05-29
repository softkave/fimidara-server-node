import OperationError from '../../utilities/OperationError';

export class FileExistsError extends OperationError {
    public name = 'FileExistsError';
    public message = 'File exists';
}

export class FileDoesNotExistError extends OperationError {
    public name = 'FileDoesNotExistError';
    public message = 'File does not exist';
}
