import {nanoid} from 'nanoid';
import {
  AppResourceType,
  resourceTypeShortNameMaxLen,
  resourceTypeShortNames,
  shortNameToResourceTypes,
} from '../definitions/system';
import {endpointConstants} from '../endpoints/constants';
import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from './OperationError';

export class InvalidResourceIdError extends OperationError {
  name = 'InvalidResourceIdError';
  statusCode = endpointConstants.httpStatusCode.badRequest;

  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Invalid resource id');
  }
}

export function getNewId(size?: number) {
  return nanoid(size);
}

const separator = '_';

// TODO: write Joi schema
export function getNewIdForResource(
  resourceType: AppResourceType,
  size?: number
) {
  const id = nanoid(size);
  const shortName = resourceTypeShortNames[resourceType];
  return `${shortName}${separator}${id}`;
}

export function isAppResourceId(resourceId: string) {
  const shortName = resourceId.slice(0, resourceTypeShortNameMaxLen);
  if (!shortName || !shortNameToResourceTypes[shortName]) {
    return false;
  }

  return true;
}
