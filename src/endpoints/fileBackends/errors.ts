import OperationError, {
  getErrorMessageFromParams,
  OperationErrorParameters,
} from '../../utils/OperationError';
import {endpointConstants} from '../constants';

export class AgentTokenExistsError extends OperationError {
  name = 'AgentTokenExistsError';
  statusCode = endpointConstants.httpStatusCode.conflict;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Agent token exists.');
  }
}

export class AgentTokenDoesNotExistError extends OperationError {
  name = 'AgentTokenDoesNotExistError';
  statusCode = endpointConstants.httpStatusCode.notFound;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Agent token not found.');
  }
}

export class BackendUnknownError extends OperationError {
  name = 'BackendUnknownError';
  statusCode = endpointConstants.httpStatusCode.notFound;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Unknown backend.');
  }
}

export class FimidaraDoesNotSupportConfigError extends OperationError {
  name = 'FimidaraDoesNotSupportConfigError';
  statusCode = endpointConstants.httpStatusCode.notFound;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(
      props,
      'Sorry fimidara does not support this config.'
    );
  }
}

export class MountSourceMissingBucketError extends OperationError {
  name = 'MountSourceMissingBucketError';
  statusCode = endpointConstants.httpStatusCode.notFound;
  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Mount is missing bucket.');
  }
}
