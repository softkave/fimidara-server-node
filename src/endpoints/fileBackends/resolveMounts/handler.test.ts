import {calculatePageSize} from '../../../utils/fns';
import {BaseContextType} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertFileBackendMountListForTest} from '../../testUtils/generateData/fileBackendMount';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertFileBackendMountForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithFileBackendMount,
} from '../../testUtils/testUtils';
import resolveMountss from './handler';
import {ResolveMountsEndpointParams} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('resolveMounts', () => {
  test('workspace agent tokens returned', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const [{token: token01}, {token: token02}] = await Promise.all([
      insertFileBackendMountForTest(context, userToken, workspace.resourceId),
      insertFileBackendMountForTest(context, userToken, workspace.resourceId),
    ]);
    const instData = RequestData.fromExpressRequest<ResolveMountsEndpointParams>(
      mockExpressRequestWithFileBackendMount(userToken),
      {workspaceId: workspace.resourceId}
    );
    const result = await resolveMountss(context, instData);
    assertEndpointResultOk(result);
    expect(result.tokens).toContainEqual(token01);
    expect(result.tokens).toContainEqual(token02);
  });

  test('pagination', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await generateAndInsertFileBackendMountListForTest(context, 15, {
      workspaceId: workspace.resourceId,
    });
    const count = await context.semantic.fileBackendMount.countByQuery({
      workspaceId: workspace.resourceId,
    });
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<ResolveMountsEndpointParams>(
      mockExpressRequestWithFileBackendMount(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    let result = await resolveMountss(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.tokens).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<ResolveMountsEndpointParams>(
      mockExpressRequestWithFileBackendMount(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    result = await resolveMountss(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.tokens).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
