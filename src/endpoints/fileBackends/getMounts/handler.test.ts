import {AppResourceTypeMap} from '../../../definitions/system';
import {getResourceTypeFromId} from '../../../utils/resource';
import {kSemanticModels} from '../../contexts/injectables';
import {kFolderConstants} from '../../folders/constants';
import {
  generateAndInsertFileBackendMountListForTest,
  generateFileBackendType,
} from '../../testUtils/generateData/fileBackend';
import {generateTestFolderpathString} from '../../testUtils/generateData/folder';
import {
  GenerateTestFieldsDef,
  generateTestFieldsCombinations,
} from '../../testUtils/generateData/utils';
import {
  completeTests,
  expectFields,
  performPaginationTest,
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

describe('getFileBackendMounts', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);

  const queryDefs: GenerateTestFieldsDef<GetFileBackendMountsEndpointParamsBase> = {
    backend: generateFileBackendType,
    configId: () => getResourceTypeFromId(AppResourceTypeMap.FileBackendConfig),
    workspaceId: () => workspace.resourceId,
    folderpath: () => generateTestFolderpathString(),
  };
  const queries = generateTestFieldsCombinations(queryDefs);

  queries.forEach(query => {
    test(`pagination with queries ${Object.keys(query).join(',')}`, async () => {
      await generateAndInsertFileBackendMountListForTest(10, {
        ...query,
        folderpath: query.folderpath?.split(kFolderConstants.separator),
      });
      const count = await kSemanticModels.fileBackendMount().countByQuery({
        workspaceId: workspace.resourceId,
      });

      await performPaginationTest(getFileBackendMounts, {
        count,
        fields: 'mounts',
        req: mockExpressRequestWithAgentToken(userToken),
        params: query,
        otherTestsFn: result =>
          expectFields(result.mounts, {
            ...query,
            folderpath: query.folderpath?.split(kFolderConstants.separator),
          }),
      });
    });
  });
});
