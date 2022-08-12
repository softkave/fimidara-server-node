import {nanoid} from 'nanoid';
import {
  AppResourceId,
  AppResourceIdShortName,
  AppResourceType,
  resourceShortNameToTypeMap,
  resourceTypeToShortNameMap,
} from '../definitions/system';
import {endpointConstants} from '../endpoints/constants';
import OperationError, {
  getErrorMessageFromParams,
  IOperationErrorParameters,
} from './OperationError';

export class InvalidResourceIdError extends OperationError {
  public name = 'InvalidResourceIdError';
  public statusCode = endpointConstants.httpStatusCode.badRequest;

  constructor(props?: IOperationErrorParameters | string) {
    super(props);
    this.message = getErrorMessageFromParams(props, 'Invalid resource id');
  }
}

export function getNewId(size?: number) {
  return nanoid(size);
}

// TODO: write Joi schema
export function getNewIdForResource(
  resourceType: AppResourceType,
  size?: number
) {
  const id = nanoid(size);
  const shortName = resourceTypeToShortNameMap[resourceType];
  return `${shortName}-${id}`;
}

export function isAppResourceId(resourceId: string) {
  const [shortName, id] = resourceId.split('-', 2);
  if (
    !shortName ||
    !id ||
    !resourceShortNameToTypeMap[shortName as AppResourceIdShortName]
  ) {
    return false;
  }

  return true;
}

export function assertAppResourceId(
  resourceId: string
): asserts resourceId is AppResourceId<any> {
  if (!isAppResourceId(resourceId)) {
    throw new InvalidResourceIdError(`Invalid resourceId: ${resourceId}`);
  }
}

export interface IAppResourceIdInfo {
  shortName: AppResourceIdShortName;
  resourceType: AppResourceType;
  id: string;
}

export function extractIdInfo(resourceId: string) {
  assertAppResourceId(resourceId);
  const [shortName, id] = resourceId.split('-', 2);
  const resourceType =
    resourceShortNameToTypeMap[shortName as AppResourceIdShortName];
  return {shortName, resourceType, id};
}
