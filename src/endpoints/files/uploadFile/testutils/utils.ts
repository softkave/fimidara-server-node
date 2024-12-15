import {faker} from '@faker-js/faker';
import {expect} from 'vitest';
import {kSemanticModels} from '../../../../contexts/injection/injectables.js';
import {PublicWorkspace, Workspace} from '../../../../definitions/workspace.js';
import {addRootnameToPath} from '../../../folders/utils.js';
import EndpointReusableQueries from '../../../queries.js';
import RequestData from '../../../RequestData.js';
import {
  GenerateTestFileType,
  kGenerateTestFileType,
} from '../../../testUtils/generate/file/generateTestFileBinary.js';
import {
  IInsertUserForTestResult,
  IInsertWorkspaceForTestResult,
  assertEndpointResultOk,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestForPublicAgent,
} from '../../../testUtils/testUtils.js';
import deleteFile from '../../deleteFile/handler.js';
import {DeleteFileEndpointParams} from '../../deleteFile/types.js';
import getFile from '../../readFile/handler.js';
import {ReadFileEndpointParams} from '../../readFile/types.js';
import updateFileDetails from '../../updateFileDetails/handler.js';
import {
  UpdateFileDetailsEndpointParams,
  UpdateFileDetailsInput,
} from '../../updateFileDetails/types.js';
import {fileExtractor} from '../../utils.js';
import {UploadFileEndpointParams} from '../types.js';
import {simpleRunUpload} from './testUploadFns.js';

export const uploadFileBaseTest = async (params: {
  isMultipart: boolean;
  input?: Partial<UploadFileEndpointParams>;
  type?: GenerateTestFileType;
  insertUserResult?: IInsertUserForTestResult;
  insertWorkspaceResult?: IInsertWorkspaceForTestResult;
}) => {
  const {isMultipart, input, type = kGenerateTestFileType.png} = params;
  const insertUserResult =
    params.insertUserResult ?? (await insertUserForTest());
  const insertWorkspaceResult =
    params.insertWorkspaceResult ??
    (await insertWorkspaceForTest(insertUserResult.userToken));

  const insertFileResult = await simpleRunUpload(isMultipart, {
    type,
    userToken: insertUserResult.userToken,
    workspace: insertWorkspaceResult.rawWorkspace,
    fileInput: input,
  });

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
  const reqData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {filepath: addRootnameToPath(filepath, workspace.rootname)}
  );

  const result = await getFile(reqData);
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

  const reqData =
    RequestData.fromExpressRequest<UpdateFileDetailsEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {
        filepath: addRootnameToPath(filepath, workspace.rootname),
        file: updateInput,
      }
    );

  const result = await updateFileDetails(reqData);
  assertEndpointResultOk(result);
}

export async function assertCanDeletePublicFile(
  workspace: Pick<Workspace, 'rootname'>,
  filepath: string
) {
  const reqData = RequestData.fromExpressRequest<DeleteFileEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {filepath: addRootnameToPath(filepath, workspace.rootname)}
  );

  const result = await deleteFile(reqData);
  assertEndpointResultOk(result);
}
