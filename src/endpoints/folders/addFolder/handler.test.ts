import faker = require('faker');
import {IFolder} from '../../../definitions/folder';
import {
  AppResourceType,
  BasicCRUDActions,
  IPublicAccessOpInput,
} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {
  assertCanDeletePublicFile,
  assertCanReadPublicFile,
  assertCanUpdatePublicFile,
  assertCanUploadToPublicFile,
  assertPublicAccessOps,
} from '../../files/uploadFile/handler.test';
import RequestData from '../../RequestData';
import {expectErrorThrown} from '../../test-utils/helpers/error';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  IInsertOrganizationForTestResult,
  IInsertUserForTestResult,
  insertFolderForTest,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestForPublicAgent,
} from '../../test-utils/test-utils';
import {PermissionDeniedError} from '../../user/errors';
import {folderConstants} from '../constants';
import deleteFolder from '../deleteFolder/handler';
import {IDeleteFolderParams} from '../deleteFolder/types';
import getFolder from '../getFolder/handler';
import {IGetFolderEndpointParams} from '../getFolder/types';
import listFolderContent from '../listFolderContent/handler';
import {IListFolderContentEndpointParams} from '../listFolderContent/types';
import FolderQueries from '../queries';
import updateFolder from '../updateFolder/handler';
import {IUpdateFolderInput, IUpdateFolderParams} from '../updateFolder/types';
import {folderExtractor} from '../utils';
import {INewFolderInput} from './types';

/**
 * TODO:
 * - Test different folder paths
 * - Test on root
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

const addFolderBaseTest = async (
  ctx: IBaseContext,
  input: Partial<INewFolderInput> = {},
  insertUserResult?: IInsertUserForTestResult,
  insertOrgResult?: IInsertOrganizationForTestResult
) => {
  insertUserResult = insertUserResult || (await insertUserForTest(ctx));
  insertOrgResult =
    insertOrgResult ||
    (await insertOrganizationForTest(ctx, insertUserResult.userToken));

  const {folder} = await insertFolderForTest(
    ctx,
    insertUserResult.userToken,
    insertOrgResult.organization.resourceId,
    input
  );

  const savedFolder = await ctx.data.folder.assertGetItem(
    FolderQueries.getById(folder.resourceId)
  );

  expect(folder).toMatchObject(folderExtractor(savedFolder));
  return {folder, savedFolder, insertUserResult, insertOrgResult};
};

const addFolderWithPublicAccessOpsTest = async (
  ctx: IBaseContext,
  input: Partial<INewFolderInput> = {},
  insertUserResult?: IInsertUserForTestResult,
  insertOrgResult?: IInsertOrganizationForTestResult
) => {
  const uploadResult = await addFolderBaseTest(ctx, input);
  const {savedFolder} = uploadResult;
  insertUserResult = uploadResult.insertUserResult;
  insertOrgResult = uploadResult.insertOrgResult;
  expect(savedFolder.publicAccessOps).toHaveLength(
    input.publicAccessOps?.length || 0
  );

  await assertPublicAccessOps(
    ctx,
    savedFolder,
    insertUserResult,
    insertOrgResult,
    input.publicAccessOps || []
  );

  return uploadResult;
};

export async function assertCanCreateFolderInPublicFolder(
  ctx: IBaseContext,
  organizationId: string,
  folderPath: string
) {
  return await insertFolderForTest(ctx, null, organizationId, {
    path: folderPath,
  });
}

export async function assertCanReadPublicFolder(
  ctx: IBaseContext,
  organizationId: string,
  folderPath: string
) {
  const instData = RequestData.fromExpressRequest<IGetFolderEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {organizationId, path: folderPath}
  );

  const result = await getFolder(ctx, instData);
  assertEndpointResultOk(result);
  return result;
}

export async function assertCanUpdatePublicFolder(
  ctx: IBaseContext,
  organizationId: string,
  folderPath: string
) {
  const updateInput: IUpdateFolderInput = {
    description: faker.lorem.words(20),
    maxFileSizeInBytes: 9_000_000_000,
  };

  const instData = RequestData.fromExpressRequest<IUpdateFolderParams>(
    mockExpressRequestForPublicAgent(),
    {
      organizationId,
      path: folderPath,
      folder: updateInput,
    }
  );

  const result = await updateFolder(ctx, instData);
  assertEndpointResultOk(result);
}

export async function assertCanListContentOfPublicFolder(
  ctx: IBaseContext,
  organizationId: string,
  folderPath: string
) {
  const instData =
    RequestData.fromExpressRequest<IListFolderContentEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {organizationId, path: folderPath}
    );

  const result = await listFolderContent(ctx, instData);
  assertEndpointResultOk(result);
}

export async function assertCanDeletePublicFolder(
  ctx: IBaseContext,
  organizationId: string,
  folderPath: string
) {
  const instData = RequestData.fromExpressRequest<IDeleteFolderParams>(
    mockExpressRequestForPublicAgent(),
    {organizationId, path: folderPath}
  );

  const result = await deleteFolder(ctx, instData);
  assertEndpointResultOk(result);
}

export async function assertPublicOps(
  ctx: IBaseContext,
  folder: IFolder,
  insertOrgResult: IInsertOrganizationForTestResult
) {
  const folderPath = folder.namePath.join(folderConstants.nameSeparator);
  const orgId = insertOrgResult.organization.resourceId;
  const {folder: folder02} = await assertCanCreateFolderInPublicFolder(
    ctx,
    orgId,
    folderPath
  );

  const folder02Path = folder02.namePath.join(folderConstants.nameSeparator);
  const {file} = await assertCanUploadToPublicFile(ctx, orgId, folder02Path);
  await assertCanListContentOfPublicFolder(ctx, orgId, folder02Path);
  await assertCanUpdatePublicFolder(ctx, orgId, folder02Path);
  await assertCanReadPublicFolder(ctx, orgId, folder02Path);

  const filePath = file.namePath.join(folderConstants.nameSeparator);
  await assertCanReadPublicFile(ctx, orgId, filePath);
  await assertCanUpdatePublicFile(ctx, orgId, filePath);
  await assertCanUploadToPublicFile(ctx, orgId, filePath);
  await assertCanDeletePublicFolder(ctx, orgId, folderPath);
}

export function makeEveryFolderPublicAccessOp() {
  return [BasicCRUDActions.All].reduce((list, action) => {
    return list.concat(
      [AppResourceType.File, AppResourceType.Folder].map(type => ({
        action,
        resourceType: type,
      }))
    );
  }, [] as IPublicAccessOpInput[]);
}

export function makeEveryFolderPublicAccessOp02() {
  return Object.values(BasicCRUDActions).reduce((list, action) => {
    return list.concat(
      [AppResourceType.File, AppResourceType.Folder].map(type => ({
        action,
        resourceType: type,
      }))
    );
  }, [] as IPublicAccessOpInput[]);
}

describe('addFolder', () => {
  test('folder created', async () => {
    assertContext(context);
    await addFolderBaseTest(context);
  });

  test('folder created with public access ops', async () => {
    assertContext(context);
    const {folder, insertOrgResult} = await addFolderWithPublicAccessOpsTest(
      context,
      {
        publicAccessOps: [
          {
            action: BasicCRUDActions.Create,
            resourceType: AppResourceType.File,
          },
          {
            action: BasicCRUDActions.Read,
            resourceType: AppResourceType.File,
          },
          {
            action: BasicCRUDActions.Create,
            resourceType: AppResourceType.Folder,
          },
          {
            action: BasicCRUDActions.Read,
            resourceType: AppResourceType.Folder,
          },
        ],
      }
    );

    const folderPath = folder.namePath.join(folderConstants.nameSeparator);
    const orgId = insertOrgResult.organization.resourceId;
    const {folder: folder02} = await assertCanCreateFolderInPublicFolder(
      context,
      orgId,
      folderPath
    );

    const folder02Path = folder02.namePath.join(folderConstants.nameSeparator);
    const {file} = await assertCanUploadToPublicFile(
      context,
      orgId,
      folder02Path
    );
    await assertCanListContentOfPublicFolder(context, orgId, folder02Path);
    const filePath = file.namePath.join(folderConstants.nameSeparator);
    await assertCanReadPublicFile(context, orgId, filePath);

    expectErrorThrown(async () => {
      assertContext(context);
      await assertCanDeletePublicFolder(context, orgId, folderPath);
    }, [PermissionDeniedError.name]);

    expectErrorThrown(async () => {
      assertContext(context);
      await assertCanDeletePublicFile(context, orgId, filePath);
    }, [PermissionDeniedError.name]);
  });

  test('folder created with all public access ops', async () => {
    assertContext(context);
    const {savedFolder, insertOrgResult} =
      await addFolderWithPublicAccessOpsTest(context, {
        publicAccessOps: makeEveryFolderPublicAccessOp(),
      });

    await assertPublicOps(context, savedFolder, insertOrgResult);
  });

  test('folder created with all public access ops', async () => {
    assertContext(context);
    const {savedFolder, insertOrgResult} =
      await addFolderWithPublicAccessOpsTest(context, {
        publicAccessOps: makeEveryFolderPublicAccessOp02(),
      });

    await assertPublicOps(context, savedFolder, insertOrgResult);
  });
});
