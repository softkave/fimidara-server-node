import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/types';
import {
  assertCanDeletePublicFile,
  assertCanReadPublicFile,
  assertCanUploadToPublicFile,
} from '../../files/uploadFile/uploadFileTestUtils';
import {generateTestFolderName} from '../../test-utils/generate-data/folder';
import {expectErrorThrown} from '../../test-utils/helpers/error';
import {assertContext, initTestBaseContext} from '../../test-utils/test-utils';
import {PermissionDeniedError} from '../../user/errors';
import {folderConstants} from '../constants';
import {
  addFolderBaseTest,
  addFolderWithPublicAccessOpsTest,
  assertCanCreateFolderInPublicFolder,
  assertCanDeletePublicFolder,
  assertCanListContentOfPublicFolder,
  assertFolderPublicOps,
  makeEveryFolderPublicAccessOp,
} from './addFolderTestUtils';

/**
 * TODO:
 * - Test different folder paths
 * - Test on root
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('addFolder', () => {
  test('folder created', async () => {
    assertContext(context);
    await addFolderBaseTest(context);
  });

  test('folder created with public access ops', async () => {
    assertContext(context);
    const {folder, insertWorkspaceResult} = await addFolderWithPublicAccessOpsTest(context, {
      publicAccessOps: [
        {
          action: BasicCRUDActions.Create,
          resourceType: AppResourceType.File,
          appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
        },
        {
          action: BasicCRUDActions.Read,
          resourceType: AppResourceType.File,
          appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
        },
        {
          action: BasicCRUDActions.Create,
          resourceType: AppResourceType.Folder,
          appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
        },
        {
          action: BasicCRUDActions.Read,
          resourceType: AppResourceType.Folder,
          appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
        },
      ],
    });

    const folderpath = folder.namePath.join(folderConstants.nameSeparator);
    const {folder: folder02} = await assertCanCreateFolderInPublicFolder(
      context,
      insertWorkspaceResult.workspace,
      folderpath
    );

    const folder02Path = folder02.namePath.join(folderConstants.nameSeparator);
    const {file} = await assertCanUploadToPublicFile(
      context,
      insertWorkspaceResult.workspace,
      folder02Path + folderConstants.nameSeparator + generateTestFolderName()
    );

    await assertCanListContentOfPublicFolder(context, insertWorkspaceResult.workspace, folder02Path);
    const filepath = file.namePath.join(folderConstants.nameSeparator);
    await assertCanReadPublicFile(context, insertWorkspaceResult.workspace, filepath);
    await expectErrorThrown(async () => {
      assertContext(context);
      await assertCanDeletePublicFolder(context, insertWorkspaceResult.workspace, folderpath);
    }, [PermissionDeniedError.name]);

    await expectErrorThrown(async () => {
      assertContext(context);
      await assertCanDeletePublicFile(context, insertWorkspaceResult.workspace, filepath);
    }, [PermissionDeniedError.name]);
  });

  test('folder created with all public access ops', async () => {
    assertContext(context);
    const {savedFolder, insertWorkspaceResult} = await addFolderWithPublicAccessOpsTest(context, {
      publicAccessOps: makeEveryFolderPublicAccessOp(),
    });

    await assertFolderPublicOps(context, savedFolder, insertWorkspaceResult);
  });

  test('folder created with all public access ops', async () => {
    assertContext(context);
    const {savedFolder, insertWorkspaceResult} = await addFolderWithPublicAccessOpsTest(context, {
      publicAccessOps: makeEveryFolderPublicAccessOp(),
    });

    await assertFolderPublicOps(context, savedFolder, insertWorkspaceResult);
  });
});
