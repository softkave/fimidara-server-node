import {kReuseableErrors} from '../../../utils/reusableErrors';
import {kSemanticModels} from '../../contexts/injectables';
import {ResourceExistsError} from '../../errors';
import {generateUniqueFolderpath} from '../../testUtils/generateData/folder';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTest} from '../../testUtils/helpers/test';
import {
  initTest,
  insertFileBackendMountForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils';
import {fileBackendMountExtractor} from '../utils';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest();
});

describe('addMount', () => {
  test('mount added', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {mount} = await insertFileBackendMountForTest(userToken, workspace.resourceId);
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
    const {mount: mount01} = await insertFileBackendMountForTest(
      userToken,
      workspace.resourceId
    );

    await expectErrorThrown(async () => {
      await insertFileBackendMountForTest(userToken, workspace.resourceId, {
        name: mount01.name,
      });
    }, [ResourceExistsError.name]);
  });

  test('fails if exact mount exists', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {mount: mount01} = await insertFileBackendMountForTest(
      userToken,
      workspace.resourceId
    );

    await expectErrorThrown(async () => {
      await insertFileBackendMountForTest(userToken, workspace.resourceId, {
        backend: mount01.backend,
        folderpath: mount01.folderpath,
        mountedFrom: mount01.mountedFrom,
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
          workspace.resourceId,
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
    await insertFileBackendMountForTest(userToken, workspace.resourceId, {
      folderpath,
    });

    const folder = await kSemanticModels
      .folder()
      .getOneByNamepath({workspaceId: workspace.resourceId, namepath: folderpath});

    expect(folder).toBeTruthy();
  });
});
