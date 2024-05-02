import {ValidationError} from '../../../utils/errors.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {ResourceExistsError} from '../../errors.js';
import {expectErrorThrown} from '../../testUtils/helpers/error.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  initTests,
  insertFileBackendConfigForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils.js';
import {fileBackendConfigExtractor} from '../utils.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('addConfig', () => {
  test('config added', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {config} = await insertFileBackendConfigForTest(
      userToken,
      workspace.resourceId
    );
    const savedConfig = fileBackendConfigExtractor(
      await kSemanticModels
        .fileBackendConfig()
        .assertGetOneByQuery({resourceId: config.resourceId})
    );
    expect(savedConfig).toMatchObject(config);
  });

  test('fails if config with name exists', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {config: config01} = await insertFileBackendConfigForTest(
      userToken,
      workspace.resourceId
    );

    await expectErrorThrown(async () => {
      await insertFileBackendConfigForTest(userToken, workspace.resourceId, {
        name: config01.name,
      });
    }, [ResourceExistsError.name]);
  });

  test('fails if config with name exists', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);

    await expectErrorThrown(async () => {
      await insertFileBackendConfigForTest(userToken, workspace.resourceId, {
        backend: 'fimidara',
      });
    }, [ValidationError.name]);
  });
});
