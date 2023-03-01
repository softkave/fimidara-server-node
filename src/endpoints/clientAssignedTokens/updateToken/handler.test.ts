import {faker} from '@faker-js/faker';
import {getTimestamp} from '../../../utils/dateFns';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertClientAssignedTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import {clientAssignedTokenExtractor, getPublicClientToken} from '../utils';
import updateClientAssignedToken from './handler';
import {IUpdateClientAssignedTokenEndpointParams, IUpdateClientAssignedTokenInput} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('client assigned token permission groups updated', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {token: token01} = await insertClientAssignedTokenForTest(
    context,
    userToken,
    workspace.resourceId
  );
  const update: IUpdateClientAssignedTokenInput = {
    name: faker.lorem.words(),
    description: faker.lorem.paragraph(),
    expires: getTimestamp(),
    providedResourceId: faker.datatype.uuid(),
  };
  const instData = RequestData.fromExpressRequest<IUpdateClientAssignedTokenEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      tokenId: token01.resourceId,
      token: update,
    }
  );

  const result = await updateClientAssignedToken(context, instData);
  assertEndpointResultOk(result);
  const updatedToken = getPublicClientToken(
    context,
    await populateAssignedTags(
      context,
      workspace.resourceId,
      await context.data.clientAssignedToken.assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(token01.resourceId)
      )
    )
  );

  expect(clientAssignedTokenExtractor(updatedToken)).toMatchObject(result.token);
  expect(updatedToken).toMatchObject(update);
});
