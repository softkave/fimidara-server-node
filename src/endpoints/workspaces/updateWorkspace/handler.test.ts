import {faker} from '@faker-js/faker';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {expectErrorThrown} from '../../test-utils/helpers/error';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import {WorkspaceExistsError, WorkspaceRootnameExistsError} from '../errors';
import updateWorkspace from './handler';
import {IUpdateWorkspaceEndpointParams, IUpdateWorkspaceInput} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('updateWorkspce', () => {
  test('workspace updated', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const companyName = faker.company.companyName();
    const workspaceUpdateInput: Partial<IUpdateWorkspaceInput> = {
      name: companyName,
      // rootname: makeRootnameFromName(companyName),
      description: faker.company.catchPhraseDescriptor(),
      // usageThresholds: generateTestUsageThresholdInputMap(500),
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
    }, [WorkspaceRootnameExistsError.name]);
  });
});
