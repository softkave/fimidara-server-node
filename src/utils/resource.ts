import {invert} from 'lodash';
import {nanoid} from 'nanoid';
import {
  Agent,
  AppResourceType,
  kAppResourceType,
  Resource,
  SessionAgent,
  WorkspaceResource,
} from '../definitions/system';
import {kEndpointConstants} from '../endpoints/constants';
import {getTimestamp} from './dateFns';
import OperationError, {
  getErrorMessageFromParams,
  OperationErrorParameters,
} from './OperationError';
import {getActionAgentFromSessionAgent, isSessionAgent} from './sessionUtils';
import {AnyObject, InvertRecord} from './types';

export const kResourceTypeShortNameMaxLength = 7;
export const kResourceTypeShortNamePadding = '0';

function padShortName(shortName: string) {
  if (shortName.length > kResourceTypeShortNameMaxLength) {
    throw new Error(
      `Resource short name is more than ${kResourceTypeShortNameMaxLength} characters`
    );
  }
  return shortName
    .padEnd(kResourceTypeShortNameMaxLength, kResourceTypeShortNamePadding)
    .toLowerCase();
}

export const kResourceTypeShortNames: Record<AppResourceType, string> = {
  [kAppResourceType.All]: padShortName('*'),
  [kAppResourceType.System]: padShortName('system'),
  [kAppResourceType.Public]: padShortName('public'),
  [kAppResourceType.Workspace]: padShortName('wrkspce'),
  [kAppResourceType.CollaborationRequest]: padShortName('corqst'),
  [kAppResourceType.AgentToken]: padShortName('agtoken'),
  [kAppResourceType.PermissionGroup]: padShortName('pmgroup'),
  [kAppResourceType.PermissionItem]: padShortName('prmitem'),
  [kAppResourceType.Folder]: padShortName('folder'),
  [kAppResourceType.File]: padShortName('file'),
  [kAppResourceType.User]: padShortName('user'),
  [kAppResourceType.Tag]: padShortName('tag'),
  [kAppResourceType.AssignedItem]: padShortName('asgitem'),
  [kAppResourceType.UsageRecord]: padShortName('urecord'),
  [kAppResourceType.EndpointRequest]: padShortName('endrqst'),
  [kAppResourceType.Job]: padShortName('job'),
  [kAppResourceType.FilePresignedPath]: padShortName('filepsp'),
  [kAppResourceType.App]: padShortName('app'),
  [kAppResourceType.FileBackendConfig]: padShortName('bckconf'),
  [kAppResourceType.FileBackendMount]: padShortName('mount'),
  [kAppResourceType.ResolvedMountEntry]: padShortName('mtentry'),
};

export const kShortNameToResourceType = invert(kResourceTypeShortNames) as InvertRecord<
  typeof kResourceTypeShortNames
>;

export class InvalidResourceIdError extends OperationError {
  name = 'InvalidResourceIdError';
  statusCode = kEndpointConstants.httpStatusCode.badRequest;

  constructor(props?: OperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Invalid resource ID');
  }
}

export function getNewId(size?: number) {
  return nanoid(size);
}

export const kIdSize = 21;
export const kIdSeparator = '_';
export const kId0 = ''.padEnd(kIdSize, kResourceTypeShortNamePadding);

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
  size = kIdSize,
  id0 = resourceType === kAppResourceType.System ||
    resourceType === kAppResourceType.Public
) {
  let id = kId0;
  if (!id0) {
    id = nanoid(size);
  }

  const shortName = kResourceTypeShortNames[resourceType];
  return `${shortName}${kIdSeparator}${id}`;
}

export function isAppResourceId(resourceId: string) {
  const shortName = resourceId.slice(0, kResourceTypeShortNameMaxLength);
  if (!shortName ?? !kShortNameToResourceType[shortName]) {
    return false;
  }
  return true;
}

export function tryGetResourceTypeFromId(id: string): AppResourceType | undefined {
  const shortName = id.slice(0, kResourceTypeShortNameMaxLength);
  const type = kShortNameToResourceType[shortName];
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
