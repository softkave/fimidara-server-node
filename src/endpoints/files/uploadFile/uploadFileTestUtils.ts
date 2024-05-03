import {faker} from '@faker-js/faker';
import {PublicWorkspace, Workspace} from '../../../definitions/workspace.js';
import RequestData from '../../RequestData.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {addRootnameToPath} from '../../folders/utils.js';
import EndpointReusableQueries from '../../queries.js';
import {
  IInsertUserForTestResult,
  IInsertWorkspaceForTestResult,
  assertEndpointResultOk,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestForPublicAgent,
} from '../../testUtils/testUtils.js';
import deleteFile from '../deleteFile/handler.js';
import {DeleteFileEndpointParams} from '../deleteFile/types.js';
import getFile from '../readFile/handler.js';
import {ReadFileEndpointParams} from '../readFile/types.js';
import updateFileDetails from '../updateFileDetails/handler.js';
import {
  UpdateFileDetailsEndpointParams,
  UpdateFileDetailsInput,
} from '../updateFileDetails/types.js';
import {fileExtractor} from '../utils.js';
import {UploadFileEndpointParams} from './types.js';
import {expect} from 'vitest';

export const uploadFileBaseTest = async (
  input: Partial<UploadFileEndpointParams> = {},
  type: 'png' | 'txt' = 'png',
  insertUserResult?: IInsertUserForTestResult,
  insertWorkspaceResult?: IInsertWorkspaceForTestResult
) => {
  insertUserResult = insertUserResult ?? (await insertUserForTest());
  insertWorkspaceResult =
    insertWorkspaceResult ??
    (await insertWorkspaceForTest(insertUserResult.userToken));
  const insertFileResult = await insertFileForTest(
    insertUserResult.userToken,
    insertWorkspaceResult.workspace,
    input,
    type
  );

  const {file} = insertFileResult;
  const savedFile = await kSemanticModels
    .file()
    .assertGetOneByQuery(
      EndpointReusableQueries.getByResourceId(file.resourceId)
    );

  expect(file).toMatchObject(fileExtractor(savedFile));

  return {
    savedFile,
    insertUserResult,
    insertWorkspaceResult,
    ...insertFileResult,
  };
};

export async function assertCanReadPublicFile(
  workspace: Pick<Workspace, 'rootname'>,
  filepath: string
) {
  const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {filepath: addRootnameToPath(filepath, workspace.rootname)}
  );

  const result = await getFile(instData);
  assertEndpointResultOk(result);
}

export async function assertCanUploadToPublicFile(
  workspace: PublicWorkspace,
  filepath: string
) {
  return await insertFileForTest(null, workspace, {
    filepath: addRootnameToPath(filepath, workspace.rootname),
  });
}

export async function assertCanUpdatePublicFile(
  workspace: Pick<Workspace, 'rootname'>,
  filepath: string
) {
  const updateInput: UpdateFileDetailsInput = {
    description: faker.lorem.paragraph(),
    mimetype: 'application/octet-stream',
  };

  const instData =
    RequestData.fromExpressRequest<UpdateFileDetailsEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {
        filepath: addRootnameToPath(filepath, workspace.rootname),
        file: updateInput,
      }
    );

  const result = await updateFileDetails(instData);
  assertEndpointResultOk(result);
}

export async function assertCanDeletePublicFile(
  workspace: Pick<Workspace, 'rootname'>,
  filepath: string
) {
  const instData = RequestData.fromExpressRequest<DeleteFileEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {filepath: addRootnameToPath(filepath, workspace.rootname)}
  );

  const result = await deleteFile(instData);
  assertEndpointResultOk(result);
}
