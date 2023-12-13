import { calculatePageSize } from '../../../utils/fns';
import RequestData from '../../RequestData';
import { kSemanticModels } from '../../contexts/injectables';
import { generateAndInsertFileBackendMountListForTest } from '../../testUtils/generateData/fileBackendMount';
import { completeTests } from '../../testUtils/helpers/test';
import {
    assertEndpointResultOk,
    initTests,
    insertFileBackendMountForTest,
    insertUserForTest,
    insertWorkspaceForTest,
    mockExpressRequestWithFileBackendMount,
} from '../../testUtils/testUtils';
import resolveMountss from './handler';
import { ResolveFileBackendMountssEndpointParams } from './types';



beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('resolveMounts', () => {
  test('workspace agent tokens returned', async () => {
    
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [{token: token01}, {token: token02}] = await Promise.all([
      insertFileBackendMountForTest(userToken, workspace.resourceId),
      insertFileBackendMountForTest(userToken, workspace.resourceId),
    ]);
    const instData =
      RequestData.fromExpressRequest<ResolveFileBackendMountssEndpointParams>(
        mockExpressRequestWithFileBackendMount(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await resolveMountss(instData);
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
    let instData =
      RequestData.fromExpressRequest<ResolveFileBackendMountssEndpointParams>(
        mockExpressRequestWithFileBackendMount(userToken),
        {page, pageSize, workspaceId: workspace.resourceId}
      );
    let result = await resolveMountss(instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.tokens).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<ResolveFileBackendMountssEndpointParams>(
      mockExpressRequestWithFileBackendMount(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    result = await resolveMountss(instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.tokens).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
