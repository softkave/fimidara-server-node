import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {ValidationError} from '../../../utils/errors.js';
import {ResourceExistsError} from '../../errors.js';
import {expectErrorThrown} from '../../testHelpers/helpers/error.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  initTests,
  insertFileBackendConfigForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testHelpers/utils.js';
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
      await kIjxSemantic
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
