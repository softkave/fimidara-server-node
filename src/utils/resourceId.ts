import {nanoid} from 'nanoid';
import {
  AppResourceType,
  resourceTypeShortNameMaxLen,
  resourceTypeShortNames,
  shortNameToResourceTypes,
} from '../definitions/system';
import {endpointConstants} from '../endpoints/constants';
import {appAssert} from './assertion';
import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from './OperationError';

export class InvalidResourceIdError extends OperationError {
  name = 'InvalidResourceIdError';
  statusCode = endpointConstants.httpStatusCode.badRequest;

  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Invalid resource ID');
  }
}

export function getNewId(size?: number) {
  return nanoid(size);
}

export const idSeparator = '_';

// TODO: write Joi schema
export function getNewIdForResource(resourceType: AppResourceType, size?: number) {
  const id = nanoid(size);
  const shortName = resourceTypeShortNames[resourceType];
  return `${shortName}${idSeparator}${id}`;
}

export function isAppResourceId(resourceId: string) {
  const shortName = resourceId.slice(0, resourceTypeShortNameMaxLen);
  if (!shortName ?? !shortNameToResourceTypes[shortName]) {
    return false;
  }
  return true;
}

export function tryGetResourceTypeFromId(id: string): AppResourceType | undefined {
  const shortName = id.slice(0, resourceTypeShortNameMaxLen);
  const type = shortNameToResourceTypes[shortName];
  return type;
}

export function getResourceTypeFromId(id: string) {
  const type = tryGetResourceTypeFromId(id);
  appAssert(!!type, new InvalidResourceIdError());
  return type;
}
