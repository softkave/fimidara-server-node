import {faker} from '@faker-js/faker';
import {IFile} from '../../../definitions/file';
import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {AppResourceType, BasicCRUDActions, IPublicAccessOpInput} from '../../../definitions/system';
import {IUserToken} from '../../../definitions/userToken';
import {IWorkspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {} from '../../../utils/fns';
import {getBufferFromStream} from '../../contexts/FilePersistenceProviderContext';
import {IBaseContext} from '../../contexts/types';
import {addRootnameToPath} from '../../folders/utils';
import PermissionItemQueries from '../../permissionItems/queries';
import {makePermissionItemInputsFromPublicAccessOps} from '../../permissionItems/utils';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {expectPermissionItemsForEntityPresent} from '../../test-utils/helpers/permissionItem';
import {
  assertEndpointResultOk,
  IInsertUserForTestResult,
  IInsertWorkspaceForTestResult,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestForPublicAgent,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import deleteFile from '../deleteFile/handler';
import {IDeleteFileEndpointParams} from '../deleteFile/types';
import getFile from '../getFile/handler';
import {IGetFileEndpointParams} from '../getFile/types';
import updateFileDetails from '../updateFileDetails/handler';
import {
  IUpdateFileDetailsEndpointParams,
  IUpdateFileDetailsInput,
} from '../updateFileDetails/types';
import {fileExtractor} from '../utils';
import {IUploadFileEndpointParams} from './types';
import assert = require('assert');

export const uploadFileBaseTest = async (
  ctx: IBaseContext,
  input: Partial<IUploadFileEndpointParams> = {},
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

  const savedFile = await ctx.data.file.assertGetOneByQuery(
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

export async function assertPublicAccessOps(
  ctx: IBaseContext,
  resource: {resourceId: string; workspaceId: string},
  insertWorkspaceResult: IInsertWorkspaceForTestResult,
  publicAccessOpsInput: IPublicAccessOpInput[]
) {
  assert(insertWorkspaceResult.workspace.publicPermissionGroupId);
  const publicPermissionItems = (
    await ctx.data.permissionItem.getManyByQuery(
      PermissionItemQueries.getByPermissionEntity(
        insertWorkspaceResult.workspace.publicPermissionGroupId
      )
    )
  ).map(item => {
    // Adding target ID because the following permission items check does
    // one-to-one item matching, i.e a permission item that gives permisssion to
    // a type and not to a specific type and resource won't work even though
    // technically, that permission item should grant access
    return {...item, targetId: item.targetId};
  });

  const basePermissionItems = makePermissionItemInputsFromPublicAccessOps(
    publicAccessOpsInput,
    resource
  );
  expectPermissionItemsForEntityPresent(
    publicPermissionItems,
    basePermissionItems,
    insertWorkspaceResult.workspace.publicPermissionGroupId
  );
}

export async function assertPublicPermissionsDonotExistForContainer(
  ctx: IBaseContext,
  workspace: Pick<IWorkspace, 'publicPermissionGroupId'>,
  containerId: string
) {
  assert(workspace.publicPermissionGroupId);
  const publicPermissionGroupPermissionitems = await ctx.data.permissionItem.getManyByQuery(
    PermissionItemQueries.getByPermissionEntity(workspace.publicPermissionGroupId)
  );

  const items = publicPermissionGroupPermissionitems.filter(
    item => item.containerId === containerId
  );
  expect(items).toHaveLength(0);
}

export const uploadFileWithPublicAccessActionTest = async (
  ctx: IBaseContext,
  input: Partial<IUploadFileEndpointParams>,
  expectedActions: BasicCRUDActions[],
  type: 'png' | 'txt' = 'png',
  insertUserResult?: IInsertUserForTestResult,
  insertWorkspaceResult?: IInsertWorkspaceForTestResult
) => {
  const uploadResult = await uploadFileBaseTest(
    ctx,
    input,
    type,
    insertUserResult,
    insertWorkspaceResult
  );
  const {savedFile} = uploadResult;
  insertUserResult = uploadResult.insertUserResult;
  insertWorkspaceResult = uploadResult.insertWorkspaceResult;
  await assertPublicAccessOps(
    ctx,
    savedFile,
    insertWorkspaceResult,
    expectedActions.map(action => {
      return {
        action,
        resourceType: AppResourceType.File,
        appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
      };
    })
  );

  return uploadResult;
};

export async function assertFileUpdated(
  ctx: IBaseContext,
  userToken: IUserToken,
  savedFile: IFile,
  updatedFile: IFile
) {
  const agent = await ctx.session.getAgent(
    ctx,
    RequestData.fromExpressRequest(mockExpressRequestWithUserToken(userToken))
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
  ctx: IBaseContext,
  workspace: IWorkspace,
  filepath: string
) {
  const instData = RequestData.fromExpressRequest<IGetFileEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {
      filepath: addRootnameToPath(filepath, workspace.rootname),
    }
  );

  const result = await getFile(ctx, instData);
  assertEndpointResultOk(result);
}

export async function assertCanUploadToPublicFile(
  ctx: IBaseContext,
  workspace: IWorkspace,
  filepath: string
) {
  return await insertFileForTest(ctx, null, workspace, {
    filepath: addRootnameToPath(filepath, workspace.rootname),
  });
}

export async function assertCanUpdatePublicFile(
  ctx: IBaseContext,
  workspace: IWorkspace,
  filepath: string
) {
  const updateInput: IUpdateFileDetailsInput = {
    description: faker.lorem.paragraph(),
    mimetype: 'application/octet-stream',
  };

  const instData = RequestData.fromExpressRequest<IUpdateFileDetailsEndpointParams>(
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
  ctx: IBaseContext,
  workspace: IWorkspace,
  filepath: string
) {
  const instData = RequestData.fromExpressRequest<IDeleteFileEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {
      filepath: addRootnameToPath(filepath, workspace.rootname),
    }
  );

  const result = await deleteFile(ctx, instData);
  assertEndpointResultOk(result);
}
