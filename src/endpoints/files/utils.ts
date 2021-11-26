import {isArray} from 'lodash';
import {IFile} from '../../definitions/file';
import {BasicCRUDActions, ISessionAgent} from '../../definitions/system';
import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {checkAuthorizationForFile} from '../contexts/authorizationChecks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {splitFolderPath} from '../folders/utils';
import {checkOrganizationExists} from '../organizations/utils';
import RequestData from '../RequestData';
import {agentExtractor} from '../utils';
import FileQueries from './queries';
import {IPublicFile} from './types';

const fileFields = getFields<IPublicFile>({
  fileId: true,
  createdBy: agentExtractor,
  createdAt: getDateString,
  lastUpdatedBy: agentExtractor,
  lastUpdatedAt: getDateString,
  name: true,
  description: true,
  environmentId: true,
  folderId: true,
  mimetype: true,
  organizationId: true,
  size: true,
  encoding: true,
  meta: meta => meta,
});

export const fileExtractor = makeExtract(fileFields);
export const fileListExtractor = makeListExtract(fileFields);

export async function checkFileAuthorization(
  context: IBaseContext,
  agent: ISessionAgent,
  file: IFile,
  action: BasicCRUDActions
) {
  const organization = await checkOrganizationExists(
    context,
    file.organizationId
  );

  await checkAuthorizationForFile(
    context,
    agent,
    organization.organizationId,
    file,
    action
  );

  return {agent, file, organization};
}

export async function checkFileAuthorizationWithFileId(
  context: IBaseContext,
  agent: ISessionAgent,
  id: string,
  action: BasicCRUDActions
) {
  const file = await context.data.file.assertGetItem(FileQueries.getById(id));
  return checkFileAuthorization(context, agent, file, action);
}

export async function checkFileAuthorizationWithPath(
  context: IBaseContext,
  agent: ISessionAgent,
  organizationId: string,
  path: string | string[],
  action: BasicCRUDActions
) {
  const splitPath = isArray(path) ? path : splitFolderPath(path);
  const file = await context.data.file.assertGetItem(
    FileQueries.getByNamePath(organizationId, splitPath)
  );
  return checkFileAuthorization(context, agent, file, action);
}

export abstract class FileUtils {
  static getPublicFile = fileExtractor;
  static getPublicFileList = fileListExtractor;
}
