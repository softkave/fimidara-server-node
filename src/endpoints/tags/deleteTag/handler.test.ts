import {IBaseContext} from '../../contexts/BaseContext';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {insertTagForTest} from '../../test-utils/helpers/tag';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import deleteTag from './handler';
import {IDeleteTagEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

describe('deleteTag', () => {
  test('tag deleted', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {organization} = await insertOrganizationForTest(context, userToken);
    const {tag} = await insertTagForTest(
      context,
      userToken,
      organization.resourceId
    );

    const instData = RequestData.fromExpressRequest<IDeleteTagEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {tagId: tag.resourceId}
    );

    const result = await deleteTag(context, instData);
    assertEndpointResultOk(result);
    const deletedTagExists = await context.data.tag.checkItemExists(
      EndpointReusableQueries.getById(tag.resourceId)
    );

    expect(deletedTagExists).toBeFalsy();
  });
});
