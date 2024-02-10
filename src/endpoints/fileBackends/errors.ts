import OperationError, {
  getErrorMessageFromParams,
  OperationErrorParameters,
} from '../../utils/OperationError';
import {kEndpointConstants} from '../constants';

export class AgentTokenExistsError extends OperationError {
  name = 'AgentTokenExistsError';
  statusCode = kEndpointConstants.httpStatusCode.conflict;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Agent token exists');
  }
}

export class AgentTokenDoesNotExistError extends OperationError {
  name = 'AgentTokenDoesNotExistError';
  statusCode = kEndpointConstants.httpStatusCode.notFound;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Agent token not found');
  }
}

export class MountSourceMissingBucketError extends OperationError {
  name = 'MountSourceMissingBucketError';
  statusCode = kEndpointConstants.httpStatusCode.notFound;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Mount is missing bucket');
  }
}
