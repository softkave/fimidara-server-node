import * as faker from 'faker';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertWorkspaceForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import WorkspaceQueries from '../queries';
import updateWorkspace from './handler';
import {IUpdateWorkspaceInput, IUpdateWorkspaceEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('workspace updated', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const workspaceUpdateInput: Partial<IUpdateWorkspaceInput> = {
    name: faker.company.companyName(),
    description: faker.company.catchPhraseDescriptor(),
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

  const updatedWorkspace = await context.data.workspace.assertGetItem(
    WorkspaceQueries.getById(workspace.resourceId)
  );
  expect(updatedWorkspace).toMatchObject(workspaceUpdateInput);
});