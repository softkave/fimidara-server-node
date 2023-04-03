import {invert} from 'lodash';
import {nanoid} from 'nanoid';
import {AppResourceType} from '../definitions/system';
import {endpointConstants} from '../endpoints/constants';
import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from './OperationError';
import {InvertRecord} from './types';

export const RESOURCE_TYPE_SHORT_NAME_MAX_LEN = 7;
export const RESOURCE_TYPE_SHORT_NAME_PADDING = '0';

function padShortName(shortName: string) {
  if (shortName.length > RESOURCE_TYPE_SHORT_NAME_MAX_LEN) {
    throw new Error(
      `Resource short name is more than ${RESOURCE_TYPE_SHORT_NAME_MAX_LEN} characters`
    );
  }
  return shortName
    .padEnd(RESOURCE_TYPE_SHORT_NAME_MAX_LEN, RESOURCE_TYPE_SHORT_NAME_PADDING)
    .toLowerCase();
}

export const RESOURCE_TYPE_SHORT_NAMES: Record<AppResourceType, string> = {
  [AppResourceType.All]: padShortName('*'),
  [AppResourceType.System]: padShortName('system'),
  [AppResourceType.Public]: padShortName('public'),
  [AppResourceType.Workspace]: padShortName('wrkspce'),
  [AppResourceType.CollaborationRequest]: padShortName('corqst'),
  [AppResourceType.AgentToken]: padShortName('agtoken'),
  [AppResourceType.PermissionGroup]: padShortName('pmgroup'),
  [AppResourceType.PermissionItem]: padShortName('prmitem'),
  [AppResourceType.Folder]: padShortName('folder'),
  [AppResourceType.File]: padShortName('file'),
  [AppResourceType.User]: padShortName('user'),
  [AppResourceType.Tag]: padShortName('tag'),
  [AppResourceType.AssignedItem]: padShortName('asgitem'),
  [AppResourceType.UsageRecord]: padShortName('urecord'),
  [AppResourceType.EndpointRequest]: padShortName('endrqst'),
  [AppResourceType.Job]: padShortName('job'),
};

export const SHORT_NAME_TO_RESOURCE_TYPE = invert(RESOURCE_TYPE_SHORT_NAMES) as InvertRecord<
  typeof RESOURCE_TYPE_SHORT_NAMES
>;

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
  if (!type) {
    throw new InvalidResourceIdError();
  }
  return type;
}
