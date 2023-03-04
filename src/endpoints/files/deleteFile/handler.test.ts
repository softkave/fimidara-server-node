import {IBaseContext} from '../../contexts/types';
import {addRootnameToPath} from '../../folders/utils';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import deleteFile from './handler';
import {IDeleteFileEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

async function assertFileDeleted(context: IBaseContext, id: string) {
  const exists = await context.data.file.existsByQuery(EndpointReusableQueries.getByResourceId(id));
  expect(exists).toBeFalsy();
}

test('file deleted', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {file} = await insertFileForTest(context, userToken, workspace);
  const instData = RequestData.fromExpressRequest<IDeleteFileEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {filepath: addRootnameToPath(file.name, workspace.rootname)}
  );
  const result = await deleteFile(context, instData);
  assertEndpointResultOk(result);
  await assertFileDeleted(context, file.resourceId);
});
