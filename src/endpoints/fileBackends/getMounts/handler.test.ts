import { calculatePageSize } from '../../../utils/fns';
import RequestData from '../../RequestData';
import { generateAndInsertFileBackendMountListForTest } from '../../testUtils/generateData/fileBackendMount';
import { completeTest } from '../../testUtils/helpers/test';
import {
    assertEndpointResultOk,
    insertFileBackendMountForTest,
    insertUserForTest,
    insertWorkspaceForTest,
    mockExpressRequestWithFileBackendMount,
} from '../../testUtils/testUtils';
import getFileBackendMountss from './handler';
import { GetFileBackendMountsEndpointParams } from './types';



beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest({});
});

describe('getFileBackendMounts', () => {
  test('workspace agent tokens returned', async () => {
    
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [{token: token01}, {token: token02}] = await Promise.all([
      insertFileBackendMountForTest(userToken, workspace.resourceId),
      insertFileBackendMountForTest(userToken, workspace.resourceId),
    ]);
    const instData = RequestData.fromExpressRequest<GetFileBackendMountsEndpointParams>(
      mockExpressRequestWithFileBackendMount(userToken),
      {workspaceId: workspace.resourceId}
    );
    const result = await getFileBackendMountss(instData);
    assertEndpointResultOk(result);
    expect(result.tokens).toContainEqual(token01);
    expect(result.tokens).toContainEqual(token02);
  });

  test('pagination', async () => {
    
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    await generateAndInsertFileBackendMountListForTest(15, {
      workspaceId: workspace.resourceId,
    });
    const count = await kSemanticModels.file()BackendMount.countByQuery({
      workspaceId: workspace.resourceId,
    });
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<GetFileBackendMountsEndpointParams>(
      mockExpressRequestWithFileBackendMount(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    let result = await getFileBackendMountss(instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.tokens).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<GetFileBackendMountsEndpointParams>(
      mockExpressRequestWithFileBackendMount(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    result = await getFileBackendMountss(instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.tokens).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
