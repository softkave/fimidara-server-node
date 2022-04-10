import {IBaseContext} from '../../contexts/BaseContext';
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
import getTag from './handler';
import {IGetTagEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

describe('getTag', () => {
  test('tag returned', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {organization} = await insertOrganizationForTest(context, userToken);
    const {tag: tag01} = await insertTagForTest(
      context,
      userToken,
      organization.resourceId
    );

    const instData = RequestData.fromExpressRequest<IGetTagEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {tagId: tag01.resourceId}
    );

    const result = await getTag(context, instData);
    assertEndpointResultOk(result);
    expect(result.tag).toEqual(tag01);
  });
});
