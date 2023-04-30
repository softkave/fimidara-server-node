import {faker} from '@faker-js/faker';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {WorkspaceExistsError} from '../errors';
import updateWorkspace from './handler';
import {UpdateWorkspaceEndpointParams, UpdateWorkspaceInput} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('updateWorkspce', () => {
  test('workspace updated', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const companyName = faker.company.name();
    const workspaceUpdateInput: Partial<UpdateWorkspaceInput> = {
      name: companyName,
      // rootname: makeRootnameFromName(companyName),
      description: faker.company.catchPhraseDescriptor(),
      // usageThresholds: generateTestUsageThresholdInputMap(500),
    };

    const instData = RequestData.fromExpressRequest<UpdateWorkspaceEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        workspaceId: workspace.resourceId,
        workspace: workspaceUpdateInput,
      }
    );

    const result = await updateWorkspace(context, instData);
    assertEndpointResultOk(result);
    expect(result.workspace).toMatchObject(workspaceUpdateInput);
    const updatedWorkspace = await context.semantic.workspace.getOneByQuery(
      EndpointReusableQueries.getByResourceId(workspace.resourceId)
    );
    expect(updatedWorkspace).toMatchObject(workspaceUpdateInput);
  });

  test('fails if workspace name exists', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {workspace: w02} = await insertWorkspaceForTest(context, userToken);
    await expectErrorThrown(async () => {
      assertContext(context);
      const instData = RequestData.fromExpressRequest<UpdateWorkspaceEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId, workspace: {name: w02.name}}
      );

      await updateWorkspace(context, instData);
    }, [WorkspaceExistsError.name]);
  });
});
