import OperationError from '../../utilities/OperationError';

export class ProgramAccessTokenExistsError extends OperationError {
    public name = 'ProgramAccessTokenExistsError';
    public message = 'Program access token exists';
}

export class ProgramAccessTokenDoesNotExistError extends OperationError {
    public name = 'ProgramAccessTokenDoesNotExistError';
    public message = 'Program access token does not exist';
}
