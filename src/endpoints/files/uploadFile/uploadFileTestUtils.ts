import {faker} from '@faker-js/faker';
import {PublicWorkspace, Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {streamToBuffer} from '../../../utils/fns';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
import {addRootnameToPath} from '../../folders/utils';
import EndpointReusableQueries from '../../queries';
import {
  IInsertUserForTestResult,
  IInsertWorkspaceForTestResult,
  assertEndpointResultOk,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestForPublicAgent,
} from '../../testUtils/testUtils';
import deleteFile from '../deleteFile/handler';
import {DeleteFileEndpointParams} from '../deleteFile/types';
import getFile from '../readFile/handler';
import {ReadFileEndpointParams} from '../readFile/types';
import updateFileDetails from '../updateFileDetails/handler';
import {
  UpdateFileDetailsEndpointParams,
  UpdateFileDetailsInput,
} from '../updateFileDetails/types';
import {fileExtractor} from '../utils';
import {UploadFileEndpointParams} from './types';

export const uploadFileBaseTest = async (
  ctx: BaseContextType,
  input: Partial<UploadFileEndpointParams> = {},
  type: 'png' | 'txt' = 'png',
  insertUserResult?: IInsertUserForTestResult,
  insertWorkspaceResult?: IInsertWorkspaceForTestResult
) => {
  insertUserResult = insertUserResult ?? (await insertUserForTest(ctx));
  insertWorkspaceResult =
    insertWorkspaceResult ??
    (await insertWorkspaceForTest(ctx, insertUserResult.userToken));
  const {file, dataBuffer} = await insertFileForTest(
    ctx,
    insertUserResult.userToken,
    insertWorkspaceResult.workspace,
    input,
    type
  );
  const persistedFile = await ctx.fileBackend.getFile({
    bucket: ctx.appVariables.S3Bucket,
    key: file.resourceId,
  });
  const savedBuffer = persistedFile.body && (await streamToBuffer(persistedFile.body));
  appAssert(savedBuffer);
  appAssert(dataBuffer);
  expect(dataBuffer.equals(savedBuffer)).toBe(true);

  const savedFile = await ctx.semantic.file.assertGetOneByQuery(
    EndpointReusableQueries.getByResourceId(file.resourceId)
  );
  expect(file).toMatchObject(fileExtractor(savedFile));
  return {
    file,
    savedFile,
    insertUserResult,
    insertWorkspaceResult,
    savedBuffer,
  };
};

export async function assertCanReadPublicFile(
  ctx: BaseContextType,
  workspace: Pick<Workspace, 'rootname'>,
  filepath: string
) {
  const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {filepath: addRootnameToPath(filepath, workspace.rootname)}
  );

  const result = await getFile(ctx, instData);
  assertEndpointResultOk(result);
}

export async function assertCanUploadToPublicFile(
  ctx: BaseContextType,
  workspace: PublicWorkspace,
  filepath: string
) {
  return await insertFileForTest(ctx, null, workspace, {
    filepath: addRootnameToPath(filepath, workspace.rootname),
  });
}

export async function assertCanUpdatePublicFile(
  ctx: BaseContextType,
  workspace: Pick<Workspace, 'rootname'>,
  filepath: string
) {
  const updateInput: UpdateFileDetailsInput = {
    description: faker.lorem.paragraph(),
    mimetype: 'application/octet-stream',
  };

  const instData = RequestData.fromExpressRequest<UpdateFileDetailsEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {
      filepath: addRootnameToPath(filepath, workspace.rootname),
      file: updateInput,
    }
  );

  const result = await updateFileDetails(ctx, instData);
  assertEndpointResultOk(result);
}

export async function assertCanDeletePublicFile(
  ctx: BaseContextType,
  workspace: Pick<Workspace, 'rootname'>,
  filepath: string
) {
  const instData = RequestData.fromExpressRequest<DeleteFileEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {filepath: addRootnameToPath(filepath, workspace.rootname)}
  );

  const result = await deleteFile(ctx, instData);
  assertEndpointResultOk(result);
}
