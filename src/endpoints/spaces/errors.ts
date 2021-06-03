import OperationError from '../../utilities/OperationError';

export class SpaceExistsError extends OperationError {
    public name = 'SpaceExistsError';
    public message = 'Space exists';
}

export class SpaceDoesNotExistError extends OperationError {
    public name = 'SpaceDoesNotExistError';
    public message = 'Space does not exist';
}
