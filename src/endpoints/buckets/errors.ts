import OperationError from '../../utilities/OperationError';

export class BucketExistsError extends OperationError {
    public name = 'BucketExistsError';
    public message = 'Bucket exists';
}

export class BucketDoesNotExistError extends OperationError {
    public name = 'BucketDoesNotExistError';
    public message = 'Bucket does not exist';
}
