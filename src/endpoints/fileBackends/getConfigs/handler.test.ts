import {calculatePageSize} from '../../../utils/fns';
import {BaseContextType} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertFileBackendConfigListForTest} from '../../testUtils/generateData/fileBackendConfig';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertFileBackendConfigForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithFileBackendConfig,
} from '../../testUtils/testUtils';
import getFileBackendConfigs from './handler';
import {GetFileBackendConfigsEndpointParams} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('getFileBackendConfigs', () => {
  test('workspace agent tokens returned', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const [{token: token01}, {token: token02}] = await Promise.all([
      insertFileBackendConfigForTest(context, userToken, workspace.resourceId),
      insertFileBackendConfigForTest(context, userToken, workspace.resourceId),
    ]);
    const instData = RequestData.fromExpressRequest<GetFileBackendConfigsEndpointParams>(
      mockExpressRequestWithFileBackendConfig(userToken),
      {workspaceId: workspace.resourceId}
    );
    const result = await getFileBackendConfigs(context, instData);
    assertEndpointResultOk(result);
    expect(result.tokens).toContainEqual(token01);
    expect(result.tokens).toContainEqual(token02);
  });

  test('pagination', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await generateAndInsertFileBackendConfigListForTest(context, 15, {
      workspaceId: workspace.resourceId,
    });
    const count = await context.semantic.fileBackendConfig.countByQuery({
      workspaceId: workspace.resourceId,
    });
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<GetFileBackendConfigsEndpointParams>(
      mockExpressRequestWithFileBackendConfig(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    let result = await getFileBackendConfigs(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.tokens).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<GetFileBackendConfigsEndpointParams>(
      mockExpressRequestWithFileBackendConfig(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    result = await getFileBackendConfigs(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.tokens).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
