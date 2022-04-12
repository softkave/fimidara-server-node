import faker = require('faker');
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {
  assertCanDeletePublicFile,
  assertCanReadPublicFile,
  assertCanUploadToPublicFile,
} from '../../files/uploadFile/uploadFileTestUtils';
import {expectErrorThrown} from '../../test-utils/helpers/error';
import {assertContext, getTestBaseContext} from '../../test-utils/test-utils';
import {PermissionDeniedError} from '../../user/errors';
import {folderConstants} from '../constants';
import {
  addFolderBaseTest,
  addFolderWithPublicAccessOpsTest,
  assertCanCreateFolderInPublicFolder,
  assertCanListContentOfPublicFolder,
  assertCanDeletePublicFolder,
  makeEveryFolderPublicAccessOp,
  assertPublicOps,
  makeEveryFolderPublicAccessOp02,
} from './addFolderTestUtils';

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

describe('addFolder', () => {
  test('folder created', async () => {
    assertContext(context);
    await addFolderBaseTest(context);
  });

  test('folder created with public access ops', async () => {
    assertContext(context);
    const {folder, insertWorkspaceResult} =
      await addFolderWithPublicAccessOpsTest(context, {
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

    const folderpath = folder.namePath.join(folderConstants.nameSeparator);
    const workspaceId = insertWorkspaceResult.workspace.resourceId;
    const {folder: folder02} = await assertCanCreateFolderInPublicFolder(
      context,
      workspaceId,
      folderpath
    );

    const folder02Path = folder02.namePath.join(folderConstants.nameSeparator);
    const {file} = await assertCanUploadToPublicFile(
      context,
      workspaceId,
      folder02Path + '/' + faker.lorem.word()
    );

    await assertCanListContentOfPublicFolder(
      context,
      workspaceId,
      folder02Path
    );
    const filepath = file.namePath.join(folderConstants.nameSeparator);
    await assertCanReadPublicFile(context, workspaceId, filepath);
    await expectErrorThrown(async () => {
      assertContext(context);
      await assertCanDeletePublicFolder(context, workspaceId, folderpath);
    }, [PermissionDeniedError.name]);

    await expectErrorThrown(async () => {
      assertContext(context);
      await assertCanDeletePublicFile(context, workspaceId, filepath);
    }, [PermissionDeniedError.name]);
  });

  test('folder created with all public access ops', async () => {
    assertContext(context);
    const {savedFolder, insertWorkspaceResult} =
      await addFolderWithPublicAccessOpsTest(context, {
        publicAccessOps: makeEveryFolderPublicAccessOp(),
      });

    await assertPublicOps(context, savedFolder, insertWorkspaceResult);
  });

  test('folder created with all public access ops', async () => {
    assertContext(context);
    const {savedFolder, insertWorkspaceResult} =
      await addFolderWithPublicAccessOpsTest(context, {
        publicAccessOps: makeEveryFolderPublicAccessOp02(),
      });

    await assertPublicOps(context, savedFolder, insertWorkspaceResult);
  });
});
