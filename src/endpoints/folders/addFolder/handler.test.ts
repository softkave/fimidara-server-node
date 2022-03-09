import faker = require('faker');
import {defaultTo} from 'lodash';
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
} from '../../files/uploadFile/handler.test';
import PermissionItemQueries from '../../permissionItems/queries';
import {makePermissionItemInputsFromPublicAccessOps} from '../../permissionItems/utils';
import RequestData from '../../RequestData';
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
  mockExpressRequestWithUserToken,
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
  input: Partial<INewFolderInput> = {},
  insertUserResult?: IInsertUserForTestResult,
  insertOrgResult?: IInsertOrganizationForTestResult
) => {
  assertContext(context);
  insertUserResult = insertUserResult || (await insertUserForTest(context));
  insertOrgResult =
    insertOrgResult ||
    (await insertOrganizationForTest(context, insertUserResult.userToken));

  const {folder} = await insertFolderForTest(
    context,
    insertUserResult.userToken,
    insertOrgResult.organization.resourceId,
    input
  );

  const savedFolder = await context.data.folder.assertGetItem(
    FolderQueries.getById(folder.resourceId)
  );

  expect(folder).toMatchObject(folderExtractor(savedFolder));
  return {folder, savedFolder, insertUserResult, insertOrgResult};
};

const addFolderWithPublicAccessOpsTest = async (
  input: Partial<INewFolderInput> = {},
  insertUserResult?: IInsertUserForTestResult,
  insertOrgResult?: IInsertOrganizationForTestResult
) => {
  assertContext(context);
  const uploadResult = await addFolderBaseTest(input);
  const {savedFolder} = uploadResult;
  insertUserResult = uploadResult.insertUserResult;
  insertOrgResult = uploadResult.insertOrgResult;
  expect(savedFolder.publicAccessOps).toHaveLength(
    input.publicAccessOps?.length || 0
  );

  const agent = await context.session.getAgent(
    context,
    RequestData.fromExpressRequest(
      mockExpressRequestWithUserToken(insertUserResult.userToken)
    )
  );

  expect(savedFolder.publicAccessOps).toContain(
    expect.arrayContaining(
      defaultTo(input.publicAccessOps, []).map(op => {
        return {
          action: op.action,
          resourceType: op.resourceType,
          markedBy: agent,
        };
      })
    )
  );

  const publicPresetPermissionitems =
    await context.data.permissionItem.getManyItems(
      PermissionItemQueries.getByPermissionEntity(
        insertOrgResult.organization.publicPresetId!,
        AppResourceType.PresetPermissionsGroup
      )
    );

  const basePermissionItems = makePermissionItemInputsFromPublicAccessOps(
    savedFolder.resourceId,
    AppResourceType.Folder,
    savedFolder.publicAccessOps
  );

  expect(publicPresetPermissionitems).toContainEqual(
    expect.arrayContaining(basePermissionItems)
  );

  return uploadResult;
};

export async function assertCanCreateFolderInPublicFolder(
  organizationId: string,
  folderPath: string
) {
  assertContext(context);
  return await insertFolderForTest(context, null, organizationId, {
    path: folderPath,
  });
}

export async function assertCanReadPublicFolder(
  organizationId: string,
  folderPath: string
) {
  const instData = RequestData.fromExpressRequest<IGetFolderEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {organizationId, path: folderPath}
  );

  assertContext(context);
  const result = await getFolder(context, instData);
  assertEndpointResultOk(result);
  return result;
}

export async function assertCanUpdatePublicFolder(
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

  assertContext(context);
  const result = await updateFolder(context, instData);
  assertEndpointResultOk(result);
}

export async function assertCanListContentOfPublicFolder(
  organizationId: string,
  folderPath: string
) {
  const instData =
    RequestData.fromExpressRequest<IListFolderContentEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {organizationId, path: folderPath}
    );

  assertContext(context);
  const result = await listFolderContent(context, instData);
  assertEndpointResultOk(result);
}

export async function assertCanDeletePublicFolder(
  organizationId: string,
  folderPath: string
) {
  const instData = RequestData.fromExpressRequest<IDeleteFolderParams>(
    mockExpressRequestForPublicAgent(),
    {organizationId, path: folderPath}
  );

  assertContext(context);
  const result = await deleteFolder(context, instData);
  assertEndpointResultOk(result);
}

export async function assertPublicOps(
  folder: IFolder,
  insertOrgResult: IInsertOrganizationForTestResult
) {
  const folderPath = folder.namePath.join(folderConstants.nameSeparator);
  const orgId = insertOrgResult.organization.resourceId;
  const {folder: folder02} = await assertCanCreateFolderInPublicFolder(
    orgId,
    folderPath
  );

  const folder02Path = folder02.namePath.join(folderConstants.nameSeparator);
  const {file} = await assertCanUploadToPublicFile(orgId, folder02Path);
  await assertCanListContentOfPublicFolder(orgId, folder02Path);
  await assertCanUpdatePublicFolder(orgId, folder02Path);
  await assertCanReadPublicFolder(orgId, folder02Path);

  const filePath = file.namePath.join(folderConstants.nameSeparator);
  await assertCanReadPublicFile(orgId, filePath);
  await assertCanUpdatePublicFile(orgId, filePath);
  await assertCanUploadToPublicFile(orgId, filePath);
  await assertCanDeletePublicFolder(orgId, folderPath);
}

describe('addFolder', () => {
  test('folder created', async () => {
    await addFolderBaseTest();
  });

  test('folder created with public access ops', async () => {
    const {folder, insertOrgResult} = await addFolderWithPublicAccessOpsTest({
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
    });

    const folderPath = folder.namePath.join(folderConstants.nameSeparator);
    const orgId = insertOrgResult.organization.resourceId;
    const {folder: folder02} = await assertCanCreateFolderInPublicFolder(
      orgId,
      folderPath
    );

    const folder02Path = folder02.namePath.join(folderConstants.nameSeparator);
    const {file} = await assertCanUploadToPublicFile(orgId, folder02Path);
    await assertCanListContentOfPublicFolder(orgId, folder02Path);
    const filePath = file.namePath.join(folderConstants.nameSeparator);
    await assertCanReadPublicFile(orgId, filePath);

    expect(
      async () => await assertCanDeletePublicFolder(orgId, folderPath)
    ).toThrowError(PermissionDeniedError);

    expect(
      async () => await assertCanDeletePublicFile(orgId, filePath)
    ).toThrowError(PermissionDeniedError);
  });

  test('folder created with all public access ops', async () => {
    const {savedFolder, insertOrgResult} =
      await addFolderWithPublicAccessOpsTest({
        publicAccessOps: [BasicCRUDActions.All].reduce((list, action) => {
          return list.concat(
            [AppResourceType.File, AppResourceType.Folder].map(type => ({
              action,
              resourceType: type,
            }))
          );
        }, [] as IPublicAccessOpInput[]),
      });

    await assertPublicOps(savedFolder, insertOrgResult);
  });

  test('folder created with all public access ops', async () => {
    const {savedFolder, insertOrgResult} =
      await addFolderWithPublicAccessOpsTest({
        publicAccessOps: Object.values(BasicCRUDActions).reduce(
          (list, action) => {
            return list.concat(
              [AppResourceType.File, AppResourceType.Folder].map(type => ({
                action,
                resourceType: type,
              }))
            );
          },
          [] as IPublicAccessOpInput[]
        ),
      });

    await assertPublicOps(savedFolder, insertOrgResult);
  });
});
