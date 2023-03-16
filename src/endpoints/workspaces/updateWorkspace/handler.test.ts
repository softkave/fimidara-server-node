import {faker} from '@faker-js/faker';
import {IBaseContext} from '../../contexts/types';
import {disposeGlobalUtils} from '../../globalUtils';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {WorkspaceExistsError, WorkspaceRootnameExistsError} from '../errors';
import updateWorkspace from './handler';
import {IUpdateWorkspaceEndpointParams, IUpdateWorkspaceInput} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await disposeGlobalUtils();
  await context?.dispose();
});

describe('updateWorkspce', () => {
  test('workspace updated', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const companyName = faker.company.name();
    const workspaceUpdateInput: Partial<IUpdateWorkspaceInput> = {
      name: companyName,
      // rootname: makeRootnameFromName(companyName),
      description: faker.company.catchPhraseDescriptor(),
      // usageThresholds: generateTestUsageThresholdInputMap(500),
    };

    const instData = RequestData.fromExpressRequest<IUpdateWorkspaceEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        workspaceId: workspace.resourceId,
        workspace: workspaceUpdateInput,
      }
    );

    const result = await updateWorkspace(context, instData);
    assertEndpointResultOk(result);
    expect(result.workspace).toMatchObject(workspaceUpdateInput);
    const updatedWorkspace = await context.semantic.workspace.getOneByLiteralDataQuery(
      EndpointReusableQueries.getByResourceId(workspace.resourceId)
    );
    expect(updatedWorkspace).toMatchObject(workspaceUpdateInput);
  });

  test('fails if workspace name exists', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await expectErrorThrown(async () => {
      assertContext(context);
      const instData = RequestData.fromExpressRequest<IUpdateWorkspaceEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
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
      const instData = RequestData.fromExpressRequest<IUpdateWorkspaceEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          workspaceId: workspace.resourceId,
          workspace: {name: workspace.name},
        }
      );

      await updateWorkspace(context, instData);
    }, [WorkspaceRootnameExistsError.name]);
  });
});
