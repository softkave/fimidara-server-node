import {kReuseableErrors} from '../../../utils/reusableErrors';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {ResourceExistsError} from '../../errors';
import {kFolderConstants} from '../../folders/constants';
import {stringifyFoldernamepath} from '../../folders/utils';
import {generateUniqueFolderpath} from '../../testUtils/generate/folder';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTests} from '../../testUtils/helpers/test';
import {
  initTests,
  insertFileBackendMountForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils';
import {fileBackendMountExtractor} from '../utils';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('addMount', () => {
  test('mount added', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {mount} = await insertFileBackendMountForTest(userToken, workspace);
    const savedMount = fileBackendMountExtractor(
      await kSemanticModels
        .fileBackendMount()
        .assertGetOneByQuery({resourceId: mount.resourceId})
    );

    expect(savedMount).toMatchObject(mount);
  });

  test('fails if mount with name exists', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {mount: mount01} = await insertFileBackendMountForTest(userToken, workspace);

    await expectErrorThrown(async () => {
      await insertFileBackendMountForTest(userToken, workspace, {
        name: mount01.name,
      });
    }, [ResourceExistsError.name]);
  });

  test('fails if exact mount exists', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {mount: mount01} = await insertFileBackendMountForTest(userToken, workspace);

    await expectErrorThrown(async () => {
      await insertFileBackendMountForTest(userToken, workspace, {
        backend: mount01.backend,
        folderpath: stringifyFoldernamepath(
          {namepath: mount01.folderpath},
          workspace.rootname
        ),
        mountedFrom: mount01.mountedFrom.join(kFolderConstants.separator),
      });
    }, [ResourceExistsError.name]);
  });

  test('fails if config does not exist', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);

    await expectErrorThrown(
      async () => {
        await insertFileBackendMountForTest(
          userToken,
          workspace,
          {},
          /** do not insert config */ false
        );
      },
      error => (error as Error).message === kReuseableErrors.config.notFound().message
    );
  });

  test('mount destination folders are ensured', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const folderpath = await generateUniqueFolderpath(workspace.resourceId);
    await insertFileBackendMountForTest(userToken, workspace, {
      folderpath: stringifyFoldernamepath({namepath: folderpath}, workspace.rootname),
    });

    const folder = await kSemanticModels
      .folder()
      .getOneByNamepath({workspaceId: workspace.resourceId, namepath: folderpath});

    expect(folder).toBeTruthy();
  });
});
