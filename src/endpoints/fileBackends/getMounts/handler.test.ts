import {omit} from 'lodash-es';
import {afterAll, beforeAll, describe, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {pathSplit} from '../../../utils/fns.js';
import {FolderQueries} from '../../folders/queries.js';
import EndpointReusableQueries from '../../queries.js';
import {
  generateAndInsertFileBackendConfigListForTest,
  generateAndInsertFileBackendMountListForTest,
  generateFileBackendType,
} from '../../testHelpers/generate/fileBackend.js';
import {generateTestFolderpathString} from '../../testHelpers/generate/folder.js';
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
import getFileBackendMounts from './handler.js';
import {GetFileBackendMountsEndpointParamsBase} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('getFileBackendMounts', () => {
  test('pagination', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);

    const queryDefs: GenerateTestFieldsDef<GetFileBackendMountsEndpointParamsBase> =
      {
        backend: generateFileBackendType,
        configId: async () => {
          const [config] = await generateAndInsertFileBackendConfigListForTest(
            1,
            {
              workspaceId: workspace.resourceId,
            }
          );

          return config.resourceId;
        },
        workspaceId: () => workspace.resourceId,
        folderpath: () => generateTestFolderpathString(),
      };
    const queries = await generateTestFieldsCombinations(
      queryDefs,
      TestFieldsPresetCombinations.incrementallyAdd
    );

    await testCombinations(queries, async query => {
      query = {...query, workspaceId: workspace.resourceId};
      const folderpath = pathSplit(query.folderpath);
      await generateAndInsertFileBackendMountListForTest(10, {
        ...query,
        namepath: folderpath,
      });
      const count = await kIjxSemantic
        .fileBackendMount()
        .countByQuery(
          EndpointReusableQueries.merge(
            {},
            query,
            folderpath
              ? FolderQueries.getByNamepathOnly({namepath: folderpath})
              : {}
          )
        );

      await performPaginationTest(getFileBackendMounts, {
        count,
        fields: 'mounts',
        req: mockExpressRequestWithAgentToken(userToken),
        params: {
          backend: query.backend,
          configId: query.configId,
          folderpath: query.folderpath,
          workspaceId: query.workspaceId,
        },
        otherTestsFn: result =>
          expectFields(
            result.mounts,
            omit({...query, namepath: folderpath}, ['folderpath'])
          ),
      });
    });
  });
});
