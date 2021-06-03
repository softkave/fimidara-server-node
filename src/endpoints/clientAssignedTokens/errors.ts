import OperationError from '../../utilities/OperationError';

export class ClientAssignedTokenExistsError extends OperationError {
    public name = 'ClientAssignedTokenExistsError';
    public message = 'Client assigned token exists';
}

export class ClientAssignedTokenDoesNotExistError extends OperationError {
    public name = 'ClientAssignedTokenDoesNotExistError';
    public message = 'Client assigned token does not exist';
}
