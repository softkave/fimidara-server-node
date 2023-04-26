import {faker} from '@faker-js/faker';
import {AgentToken} from '../../../definitions/agentToken';
import {File} from '../../../definitions/file';
import {PublicWorkspace, Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import RequestData from '../../RequestData';
import {getBufferFromStream} from '../../contexts/FilePersistenceProviderContext';
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
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import deleteFile from '../deleteFile/handler';
import {DeleteFileEndpointParams} from '../deleteFile/types';
import getFile from '../readFile/handler';
import {ReadFileEndpointParams} from '../readFile/types';
import updateFileDetails from '../updateFileDetails/handler';
import {UpdateFileDetailsEndpointParams, UpdateFileDetailsInput} from '../updateFileDetails/types';
import {fileExtractor} from '../utils';
import {UploadFileEndpointParams} from './types';
import assert = require('assert');

export const uploadFileBaseTest = async (
  ctx: BaseContextType,
  input: Partial<UploadFileEndpointParams> = {},
  type: 'png' | 'txt' = 'png',
  insertUserResult?: IInsertUserForTestResult,
  insertWorkspaceResult?: IInsertWorkspaceForTestResult
) => {
  insertUserResult = insertUserResult ?? (await insertUserForTest(ctx));
  insertWorkspaceResult =
    insertWorkspaceResult ?? (await insertWorkspaceForTest(ctx, insertUserResult.userToken));
  const {file, buffer} = await insertFileForTest(
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
  const savedBuffer = persistedFile.body && (await getBufferFromStream(persistedFile.body));
  appAssert(savedBuffer);
  expect(buffer.equals(savedBuffer)).toBe(true);

  const savedFile = await ctx.semantic.file.assertGetOneByQuery(
    EndpointReusableQueries.getByResourceId(file.resourceId)
  );
  expect(file).toMatchObject(fileExtractor(savedFile));
  return {
    file,
    savedFile,
    insertUserResult,
    insertWorkspaceResult,
  };
};

// export async function assertPublicAccessOps(
//   ctx: BaseContext,
//   resource: {resourceId: string; workspaceId: string},
//   insertWorkspaceResult: IInsertWorkspaceForTestResult,
//   publicAccessOpsInput: PublicAccessOpInput[],
//   containerId?: string | null
// ) {
//   assert(insertWorkspaceResult.workspace.publicPermissionGroupId);
//   const publicPermissionItems = (
//     await ctx.semantic.permissionItem.getManyByLiteralDataQuery(
//       PermissionItemQueries.getByPermissionEntity(
//         insertWorkspaceResult.workspace.publicPermissionGroupId
//       )
//     )
//   ).map(item => {
//     // Adding target ID because the following permission items check does
//     // one-to-one item matching, i.e a permission item that gives permisssion to
//     // a type and not to a specific type and resource won't work even though
//     // technically, that permission item should grant access
//     return {...item, targetId: item.targetId};
//   });
//   const basePermissionItems = generatePermissionItemInputsFromPublicAccessOps(
//     publicAccessOpsInput,
//     resource
//   );

//   if (!containerId) containerId = resource.workspaceId;

//   expectPermissionItemsForEntityPresent(
//     publicPermissionItems,
//     basePermissionItems,
//     insertWorkspaceResult.workspace.publicPermissionGroupId,
//     containerId
//   );
// }

// export const uploadFileWithPublicAccessActionTest = async (
//   ctx: BaseContext,
//   input: Partial<UploadFileEndpointParams>,
//   expectedActions: AppActionType[],
//   type: 'png' | 'txt' = 'png',
//   insertUserResult?: IInsertUserForTestResult,
//   insertWorkspaceResult?: IInsertWorkspaceForTestResult
// ) => {
//   const uploadResult = await uploadFileBaseTest(
//     ctx,
//     input,
//     type,
//     insertUserResult,
//     insertWorkspaceResult
//   );
//   const {savedFile} = uploadResult;
//   insertUserResult = uploadResult.insertUserResult;
//   insertWorkspaceResult = uploadResult.insertWorkspaceResult;
//   await assertPublicAccessOps(
//     ctx,
//     savedFile,
//     insertWorkspaceResult,
//     expectedActions.map(action => {
//       return {
//         action,
//         resourceType: AppResourceType.File,
//       };
//     }),
//     savedFile.parentId
//   );

//   return uploadResult;
// };

export async function assertFileUpdated(
  ctx: BaseContextType,
  userToken: AgentToken,
  savedFile: File,
  updatedFile: File
) {
  const agent = await ctx.session.getAgent(
    ctx,
    RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken))
  );

  expect(savedFile.description).not.toBe(updatedFile.description);
  expect(savedFile.extension).not.toBe(updatedFile.extension);
  expect(savedFile.mimetype).not.toBe(updatedFile.mimetype);
  expect(savedFile.size).not.toBe(updatedFile.size);
  expect(savedFile.encoding).not.toBe(updatedFile.encoding);
  expect(updatedFile.lastUpdatedAt).toBeTruthy();
  expect(updatedFile.lastUpdatedBy).toMatchObject({
    agentId: agent.agentId,
    agentType: agent.agentType,
  });
}

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
