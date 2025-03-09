import {invert} from 'lodash-es';
import {nanoid} from 'nanoid';
import {AnyObject, InvertRecord} from 'softkave-js-utils';
import {
  Agent,
  FimidaraResourceType,
  Resource,
  SessionAgent,
  WorkspaceResource,
  kFimidaraResourceType,
} from '../definitions/system.js';
import {kEndpointConstants} from '../endpoints/constants.js';
import OperationError, {
  OperationErrorParameters,
  getErrorMessageFromParams,
} from './OperationError.js';
import {getTimestamp} from './dateFns.js';
import {
  getActionAgentFromSessionAgent,
  isSessionAgent,
} from './sessionUtils.js';

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

export const kResourceTypeShortNames: Record<FimidaraResourceType, string> = {
  [kFimidaraResourceType.All]: padShortName('*'),
  [kFimidaraResourceType.System]: padShortName('system'),
  [kFimidaraResourceType.Public]: padShortName('public'),
  [kFimidaraResourceType.Workspace]: padShortName('wrkspce'),
  [kFimidaraResourceType.CollaborationRequest]: padShortName('corqst'),
  [kFimidaraResourceType.AgentToken]: padShortName('agtoken'),
  [kFimidaraResourceType.PermissionGroup]: padShortName('pmgroup'),
  [kFimidaraResourceType.PermissionItem]: padShortName('prmitem'),
  [kFimidaraResourceType.Folder]: padShortName('folder'),
  [kFimidaraResourceType.File]: padShortName('file'),
  [kFimidaraResourceType.User]: padShortName('user'),
  [kFimidaraResourceType.Tag]: padShortName('tag'),
  [kFimidaraResourceType.AssignedItem]: padShortName('asgitem'),
  [kFimidaraResourceType.UsageRecord]: padShortName('urecord'),
  [kFimidaraResourceType.EndpointRequest]: padShortName('endrqst'),
  [kFimidaraResourceType.Job]: padShortName('job'),
  [kFimidaraResourceType.PresignedPath]: padShortName('presgnd'),
  [kFimidaraResourceType.App]: padShortName('app'),
  [kFimidaraResourceType.FileBackendConfig]: padShortName('bckconf'),
  [kFimidaraResourceType.FileBackendMount]: padShortName('mount'),
  [kFimidaraResourceType.ResolvedMountEntry]: padShortName('rmtentr'),
  [kFimidaraResourceType.emailMessage]: padShortName('email'),
  [kFimidaraResourceType.emailBlocklist]: padShortName('emailbl'),
  [kFimidaraResourceType.appShard]: padShortName('appshrd'),
  [kFimidaraResourceType.jobHistory]: padShortName('jbhist'),
  [kFimidaraResourceType.script]: padShortName('script'),
  [kFimidaraResourceType.filePart]: padShortName('fpart'),
};

export const kShortNameToResourceType = invert(
  kResourceTypeShortNames
) as InvertRecord<typeof kResourceTypeShortNames>;

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
  resourceType: FimidaraResourceType,
  size = kIdSize,
  id0 = resourceType === kFimidaraResourceType.System ||
    resourceType === kFimidaraResourceType.Public
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
  if (!shortName || !kShortNameToResourceType[shortName]) {
    return false;
  }
  return true;
}

export function tryGetResourceTypeFromId(
  id: string
): FimidaraResourceType | undefined {
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
  type: FimidaraResourceType,
  seed?: Omit<T, keyof Resource> & Partial<Resource>
): Resource & T {
  const createdAt = getTimestamp();
  const resource: Resource = {
    createdAt,
    resourceId: getNewIdForResource(type),
    lastUpdatedAt: createdAt,
    isDeleted: false,
    ...seed,
  };

  return resource as T & Resource;
}

export function newWorkspaceResource<T extends AnyObject>(
  agent: Agent | SessionAgent,
  type: FimidaraResourceType,
  workspaceId: string,
  seed?: Omit<T, keyof WorkspaceResource> & Partial<WorkspaceResource>
): WorkspaceResource & T {
  const createdBy = isSessionAgent(agent)
    ? getActionAgentFromSessionAgent(agent)
    : agent;
  const createdAt = getTimestamp();
  const item: WorkspaceResource = {
    createdBy,
    createdAt,
    workspaceId,
    resourceId: getNewIdForResource(type),
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    isDeleted: false,
    ...seed,
  };
  return item as T & WorkspaceResource;
}
