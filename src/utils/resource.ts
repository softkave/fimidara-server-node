import {invert} from 'lodash';
import {nanoid} from 'nanoid';
import {
  Agent,
  AppResourceType,
  AppResourceTypeMap,
  Resource,
  SessionAgent,
  WorkspaceResource,
} from '../definitions/system';
import {endpointConstants} from '../endpoints/constants';
import OperationError, {
  OperationErrorParameters,
  getErrorMessageFromParams,
} from './OperationError';
import {getTimestamp} from './dateFns';
import {getActionAgentFromSessionAgent, isSessionAgent} from './sessionUtils';
import {AnyObject, InvertRecord} from './types';

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
  [AppResourceTypeMap.All]: padShortName('*'),
  [AppResourceTypeMap.System]: padShortName('system'),
  [AppResourceTypeMap.Public]: padShortName('public'),
  [AppResourceTypeMap.Workspace]: padShortName('wrkspce'),
  [AppResourceTypeMap.CollaborationRequest]: padShortName('corqst'),
  [AppResourceTypeMap.AgentToken]: padShortName('agtoken'),
  [AppResourceTypeMap.PermissionGroup]: padShortName('pmgroup'),
  [AppResourceTypeMap.PermissionItem]: padShortName('prmitem'),
  [AppResourceTypeMap.Folder]: padShortName('folder'),
  [AppResourceTypeMap.File]: padShortName('file'),
  [AppResourceTypeMap.User]: padShortName('user'),
  [AppResourceTypeMap.Tag]: padShortName('tag'),
  [AppResourceTypeMap.AssignedItem]: padShortName('asgitem'),
  [AppResourceTypeMap.UsageRecord]: padShortName('urecord'),
  [AppResourceTypeMap.EndpointRequest]: padShortName('endrqst'),
  [AppResourceTypeMap.Job]: padShortName('job'),
  [AppResourceTypeMap.FilePresignedPath]: padShortName('filepsp'),
};

export const SHORT_NAME_TO_RESOURCE_TYPE = invert(
  RESOURCE_TYPE_SHORT_NAMES
) as InvertRecord<typeof RESOURCE_TYPE_SHORT_NAMES>;

export class InvalidResourceIdError extends OperationError {
  name = 'InvalidResourceIdError';
  statusCode = endpointConstants.httpStatusCode.badRequest;

  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Invalid resource ID.');
  }
}

export function getNewId(size?: number) {
  return nanoid(size);
}

export const ID_SIZE = 21;
export const ID_SEPARATOR = '_';
export const ID_0 = ''.padEnd(ID_SIZE, RESOURCE_TYPE_SHORT_NAME_PADDING);

// TODO: write Joi schema
/**
 *
 * @param resourceType
 * @param size
 * @param id0 - `size` is not used when `id0` is `true`.
 * @returns
 */
export function getNewIdForResource(
  resourceType: AppResourceType,
  size = ID_SIZE,
  id0 = resourceType === AppResourceTypeMap.System ||
    resourceType === AppResourceTypeMap.Public
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

export function newResource<T extends AnyObject>(
  type: AppResourceType,
  seed?: Omit<T, keyof Resource> & Partial<Resource>
): Resource & T {
  const createdAt = getTimestamp();
  return {
    createdAt,
    resourceId: getNewIdForResource(type),
    lastUpdatedAt: createdAt,
    ...seed,
  } as Resource & T;
}

export function newWorkspaceResource<T extends AnyObject>(
  agent: Agent | SessionAgent,
  type: AppResourceType,
  workspaceId: string,
  seed?: Omit<T, keyof WorkspaceResource> & Partial<WorkspaceResource>
): WorkspaceResource & T {
  const createdBy = isSessionAgent(agent) ? getActionAgentFromSessionAgent(agent) : agent;
  const createdAt = getTimestamp();
  const item: WorkspaceResource = {
    createdBy,
    createdAt,
    workspaceId,
    resourceId: getNewIdForResource(type),
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    ...seed,
  };
  return item as T & WorkspaceResource;
}
