import {ValidationError} from '../../../utils/errors';
import {kSemanticModels} from '../../contexts/injectables';
import {ResourceExistsError} from '../../errors';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTest} from '../../testUtils/helpers/test';
import {
  initTest,
  insertFileBackendConfigForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils';
import {fileBackendConfigExtractor} from '../utils';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest();
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
