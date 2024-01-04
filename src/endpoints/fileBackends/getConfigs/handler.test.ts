import {kSemanticModels} from '../../contexts/injection/injectables';
import {
  generateAndInsertFileBackendConfigListForTest,
  generateFileBackendType,
} from '../../testUtils/generate/fileBackend';
import {
  GenerateTestFieldsDef,
  TestFieldsPresetCombinations,
  generateTestFieldsCombinations,
} from '../../testUtils/generate/utils';
import {
  completeTests,
  expectFields,
  performPaginationTest,
  testCombinations,
} from '../../testUtils/helpers/test';
import {
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import getFileBackendConfigs from './handler';
import {GetFileBackendConfigsEndpointParamsBase} from './types';

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

    const queryDefs: GenerateTestFieldsDef<GetFileBackendConfigsEndpointParamsBase> = {
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
      const count = await kSemanticModels.fileBackendConfig().countByQuery(query);

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
