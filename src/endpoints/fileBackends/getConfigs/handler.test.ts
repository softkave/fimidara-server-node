import {afterAll, beforeAll, describe, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {
  generateAndInsertFileBackendConfigListForTest,
  generateFileBackendType,
} from '../../testHelpers/generate/fileBackend.js';
import {
  GenerateTestFieldsDef,
  TestFieldsPresetCombinations,
  generateTestFieldsCombinations,
} from '../../testHelpers/generate/utils.js';
import {
  completeTests,
  expectFields,
  performPaginationTest,
  testCombinations,
} from '../../testHelpers/helpers/testFns.js';
import {
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import getFileBackendConfigs from './handler.js';
import {GetFileBackendConfigsEndpointParamsBase} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('getFileBackendConfigs', () => {
  test('pagination', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);

    const queryDefs: GenerateTestFieldsDef<GetFileBackendConfigsEndpointParamsBase> =
      {
        backend: generateFileBackendType,
        workspaceId: () => workspace.resourceId,
      };
    const queries = await generateTestFieldsCombinations(
      queryDefs,
      TestFieldsPresetCombinations.incrementallyAdd
    );

    await testCombinations(queries, async query => {
      query = {...query, workspaceId: workspace.resourceId};
      await generateAndInsertFileBackendConfigListForTest(10, query);
      const count = await kIjxSemantic.fileBackendConfig().countByQuery(query);

      await performPaginationTest(getFileBackendConfigs, {
        count,
        fields: 'configs',
        req: mockExpressRequestWithAgentToken(userToken),
        params: query,
        otherTestsFn: result => expectFields(result.configs, query),
      });
    });
  });
});
