import {faker} from '@faker-js/faker';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {generateUsageThresholdMap} from '../../test-utils/generate-data/workspace';
import {expectErrorThrown} from '../../test-utils/helpers/error';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import {WorkspaceExistsError, WorkspaceRootNameExistsError} from '../errors';
import updateWorkspace from './handler';
import {IUpdateWorkspaceEndpointParams, IUpdateWorkspaceInput} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

describe('updateWorkspce', () => {
  test('workspace updated', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const workspaceUpdateInput: Partial<IUpdateWorkspaceInput> = {
      name: faker.company.companyName(),
      rootname: faker.lorem.words().split(' ').join('-'),
      description: faker.company.catchPhraseDescriptor(),
      usageThresholds: generateUsageThresholdMap(500),
    };

    const instData =
      RequestData.fromExpressRequest<IUpdateWorkspaceEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {
          workspaceId: workspace.resourceId,
          workspace: workspaceUpdateInput,
        }
      );

    const result = await updateWorkspace(context, instData);
    assertEndpointResultOk(result);
    expect(result.workspace).toMatchObject(workspaceUpdateInput);
    const updatedWorkspace = await context.cacheProviders.workspace.getById(
      context,
      workspace.resourceId
    );
    expect(updatedWorkspace).toMatchObject(workspaceUpdateInput);
  });

  test('fails if workspace name exists', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await expectErrorThrown(async () => {
      assertContext(context);
      const instData =
        RequestData.fromExpressRequest<IUpdateWorkspaceEndpointParams>(
          mockExpressRequestWithUserToken(userToken),
          {
            workspaceId: workspace.resourceId,
            workspace: {name: workspace.name},
          }
        );

      await updateWorkspace(context, instData);
    }, [WorkspaceExistsError.name]);
  });

  test('fails if workspace root name exists', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await expectErrorThrown(async () => {
      assertContext(context);
      const instData =
        RequestData.fromExpressRequest<IUpdateWorkspaceEndpointParams>(
          mockExpressRequestWithUserToken(userToken),
          {
            workspaceId: workspace.resourceId,
            workspace: {name: workspace.name},
          }
        );

      await updateWorkspace(context, instData);
    }, [WorkspaceRootNameExistsError.name]);
  });
});
