import {isArray} from 'lodash';
import {IFile} from '../../definitions/file';
import {BasicCRUDActions} from '../../definitions/system';
import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {checkAuthorizatonForFile} from '../contexts/authorizationChecks/checkAuthorizaton';
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
  instData: RequestData,
  file: IFile,
  action: BasicCRUDActions
) {
  const agent = await context.session.getAgent(context, instData);
  const organization = await checkOrganizationExists(
    context,
    file.organizationId
  );

  await checkAuthorizatonForFile(
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
  instData: RequestData,
  id: string,
  action: BasicCRUDActions
) {
  const file = await context.data.file.assertGetItem(FileQueries.getById(id));
  return checkFileAuthorization(context, instData, file, action);
}

export async function checkFileAuthorizationWithPath(
  context: IBaseContext,
  instData: RequestData,
  path: string | string[],
  action: BasicCRUDActions
) {
  const splitPath = isArray(path) ? path : splitFolderPath(path);
  const file = await context.data.file.assertGetItem(
    FileQueries.getByNamePath(splitPath)
  );
  return checkFileAuthorization(context, instData, file, action);
}

export abstract class FileUtils {
  static getPublicFile = fileExtractor;
  static getPublicFileList = fileListExtractor;
}
