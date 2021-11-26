import {isArray} from 'lodash';
import {IFolder} from '../../definitions/folder';
import {BasicCRUDActions, ISessionAgent} from '../../definitions/system';
import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {checkAuthorizationForFolder} from '../contexts/authorizationChecks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {InvalidRequestError} from '../errors';
import {checkOrganizationExists} from '../organizations/utils';
import RequestData from '../RequestData';
import {agentExtractor} from '../utils';
import {folderConstants} from './constants';
import {FolderNotFoundError} from './errors';
import FolderQueries from './queries';
import {IPublicFolder} from './types';

const folderFields = getFields<IPublicFolder>({
  folderId: true,
  createdBy: agentExtractor,
  createdAt: getDateString,
  lastUpdatedBy: agentExtractor,
  lastUpdatedAt: getDateString,
  environmentId: true,
  maxFileSize: true,
  organizationId: true,
  parentId: true,
  name: true,
  description: true,
});

export const folderExtractor = makeExtract(folderFields);
export const folderListExtractor = makeListExtract(folderFields);

export function throwFolderNotFound() {
  throw new FolderNotFoundError();
}

export function splitFolderPath(path: string) {
  return path.split(folderConstants.nameSeparator).filter(item => !!item);
}

export function assertSplitFolderPath(path: string) {
  const splitPath = splitFolderPath(path);

  if (splitPath.length === 0) {
    throw new InvalidRequestError('Path is empty');
  }

  return splitPath;
}

export interface IFolderPathWithDetails {
  path: string;
  name: string;
  splitPath: string[];
  splitParentPath: string[];
  parentPath: string;
  hasParent: boolean;
}

export function splitFolderPathWithDetails(
  path: string
): IFolderPathWithDetails {
  const splitPath = splitFolderPath(path);
  const name = splitPath[splitPath.length - 1] || '';
  const splitParentPath = splitPath.slice(0, -1);
  const parentPath = splitParentPath.join(folderConstants.nameSeparator);
  const hasParent = splitParentPath.length > 0;
  return {
    hasParent,
    splitParentPath,
    splitPath,
    name,
    path,
    parentPath,
  };
}

export function assertSplitFolderPathWithDetails(
  path: string
): IFolderPathWithDetails {
  const result = splitFolderPathWithDetails(path);

  if (result.splitPath.length === 0) {
    throw new InvalidRequestError('Path is empty');
  }

  return result;
}

export async function checkFolderAuthorization(
  context: IBaseContext,
  agent: ISessionAgent,
  folder: IFolder,
  action: BasicCRUDActions
) {
  const organization = await checkOrganizationExists(
    context,
    folder.organizationId
  );

  await checkAuthorizationForFolder(
    context,
    agent,
    organization.organizationId,
    folder,
    action
  );

  return {agent, folder, organization};
}

export async function checkFolderAuthorizationWithFolderId(
  context: IBaseContext,
  agent: ISessionAgent,
  id: string,
  action: BasicCRUDActions
) {
  const folder = await context.data.folder.assertGetItem(
    FolderQueries.getById(id)
  );
  return checkFolderAuthorization(context, agent, folder, action);
}

export async function checkFolderAuthorizationWithPath(
  context: IBaseContext,
  agent: ISessionAgent,
  organizationId: string,
  path: string | string[],
  action: BasicCRUDActions
) {
  const splitPath = isArray(path) ? path : splitFolderPath(path);
  const folder = await context.data.folder.assertGetItem(
    FolderQueries.getByNamePath(organizationId, splitPath)
  );
  return checkFolderAuthorization(context, agent, folder, action);
}

export abstract class FolderUtils {
  static getPublicFolder = folderExtractor;
  static getPublicFolderList = folderListExtractor;
  static throwFolderNotFound = throwFolderNotFound;
}
