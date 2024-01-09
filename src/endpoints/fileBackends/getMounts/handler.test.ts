import {omit} from 'lodash';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {kFolderConstants} from '../../folders/constants';
import {FolderQueries} from '../../folders/queries';
import EndpointReusableQueries from '../../queries';
import {
  generateAndInsertFileBackendConfigListForTest,
  generateAndInsertFileBackendMountListForTest,
  generateFileBackendType,
} from '../../testUtils/generate/fileBackend';
import {generateTestFolderpathString} from '../../testUtils/generate/folder';
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
import getFileBackendMounts from './handler';
import {GetFileBackendMountsEndpointParamsBase} from './types';

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

    const queryDefs: GenerateTestFieldsDef<GetFileBackendMountsEndpointParamsBase> = {
      backend: generateFileBackendType,
      configId: async () => {
        const [config] = await generateAndInsertFileBackendConfigListForTest(1, {
          workspaceId: workspace.resourceId,
        });

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
      const folderpath = query.folderpath?.split(kFolderConstants.separator);
      await generateAndInsertFileBackendMountListForTest(10, {
        ...query,
        namepath: folderpath,
      });
      const count = await kSemanticModels
        .fileBackendMount()
        .countByQuery(
          EndpointReusableQueries.merge(
            query,
            folderpath ? FolderQueries.getByNamepathOnly({namepath: folderpath}) : {}
          )
        );

      await performPaginationTest(getFileBackendMounts, {
        count,
        fields: 'mounts',
        req: mockExpressRequestWithAgentToken(userToken),
        params: query,
        otherTestsFn: result =>
          expectFields(
            result.mounts,
            omit({...query, namepath: folderpath}, ['folderpath'])
          ),
      });
    });
  });
});
