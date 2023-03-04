import {nanoid} from 'nanoid';
import {
  AppResourceType,
  RESOURCE_TYPE_SHORT_NAMES,
  RESOURCE_TYPE_SHORT_NAME_MAX_LEN,
  RESOURCE_TYPE_SHORT_NAME_PADDING,
  SHORT_NAME_TO_RESOURCE_TYPE,
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

export const ID_SIZE = 21;
export const ID_SEPARATOR = '_';
export const ID_0 = ''.padEnd(RESOURCE_TYPE_SHORT_NAME_MAX_LEN, RESOURCE_TYPE_SHORT_NAME_PADDING);

// TODO: write Joi schema
export function getNewIdForResource(
  resourceType: AppResourceType,
  size = ID_SIZE,
  id0 = resourceType === AppResourceType.System || resourceType === AppResourceType.Public
) {
  let id = ID_0;
  if (!id0) {
    id = nanoid(size);
  }

  const shortName = RESOURCE_TYPE_SHORT_NAMES[resourceType];
  return `${shortName}${ID_SEPARATOR}${id}`;
}

export function isAppResourceId(resourceId: string) {
  const shortName = resourceId.slice(0, RESOURCE_TYPE_SHORT_NAME_MAX_LEN);
  if (!shortName ?? !SHORT_NAME_TO_RESOURCE_TYPE[shortName]) {
    return false;
  }
  return true;
}

export function tryGetResourceTypeFromId(id: string): AppResourceType | undefined {
  const shortName = id.slice(0, RESOURCE_TYPE_SHORT_NAME_MAX_LEN);
  const type = SHORT_NAME_TO_RESOURCE_TYPE[shortName];
  return type;
}

export function getResourceTypeFromId(id: string) {
  const type = tryGetResourceTypeFromId(id);
  appAssert(!!type, new InvalidResourceIdError());
  return type;
}
