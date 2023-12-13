import { calculatePageSize } from '../../../utils/fns';
import RequestData from '../../RequestData';
import { generateAndInsertFileBackendConfigListForTest } from '../../testUtils/generateData/fileBackendConfig';
import { completeTests } from '../../testUtils/helpers/test';
import {
    assertEndpointResultOk,
    insertFileBackendConfigForTest,
    insertUserForTest,
    insertWorkspaceForTest,
    mockExpressRequestWithFileBackendConfig,
} from '../../testUtils/testUtils';
import getFileBackendConfigs from './handler';
import { GetFileBackendConfigsEndpointParams } from './types';



beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTests();
});

describe('getFileBackendConfigs', () => {
  test('workspace agent tokens returned', async () => {
    
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [{token: token01}, {token: token02}] = await Promise.all([
      insertFileBackendConfigForTest(userToken, workspace.resourceId),
      insertFileBackendConfigForTest(userToken, workspace.resourceId),
    ]);
    const instData = RequestData.fromExpressRequest<GetFileBackendConfigsEndpointParams>(
      mockExpressRequestWithFileBackendConfig(userToken),
      {workspaceId: workspace.resourceId}
    );
    const result = await getFileBackendConfigs(instData);
    assertEndpointResultOk(result);
    expect(result.tokens).toContainEqual(token01);
    expect(result.tokens).toContainEqual(token02);
  });

  test('pagination', async () => {
    
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    await generateAndInsertFileBackendConfigListForTest(15, {
      workspaceId: workspace.resourceId,
    });
    const count = await kSemanticModels.file()BackendConfig.countByQuery({
      workspaceId: workspace.resourceId,
    });
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<GetFileBackendConfigsEndpointParams>(
      mockExpressRequestWithFileBackendConfig(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    let result = await getFileBackendConfigs(instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.tokens).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<GetFileBackendConfigsEndpointParams>(
      mockExpressRequestWithFileBackendConfig(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    result = await getFileBackendConfigs(instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.tokens).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
