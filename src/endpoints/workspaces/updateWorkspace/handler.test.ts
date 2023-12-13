import {faker} from '@faker-js/faker';
import RequestData from '../../RequestData';
import EndpointReusableQueries from '../../queries';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {WorkspaceExistsError} from '../errors';
import updateWorkspace from './handler';
import {UpdateWorkspaceEndpointParams, UpdateWorkspaceInput} from './types';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTests();
});

describe('updateWorkspce', () => {
  test('workspace updated', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
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

    const result = await updateWorkspace(instData);
    assertEndpointResultOk(result);
    expect(result.workspace).toMatchObject(workspaceUpdateInput);
    const updatedWorkspace = await kSemanticModels
      .workspace()
      .getOneByQuery(EndpointReusableQueries.getByResourceId(workspace.resourceId));
    expect(updatedWorkspace).toMatchObject(workspaceUpdateInput);
  });

  test('fails if workspace name exists', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {workspace: w02} = await insertWorkspaceForTest(userToken);
    await expectErrorThrown(async () => {
      const instData = RequestData.fromExpressRequest<UpdateWorkspaceEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId, workspace: {name: w02.name}}
      );

      await updateWorkspace(instData);
    }, [WorkspaceExistsError.name]);
  });
});
