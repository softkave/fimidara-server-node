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
import getOrganizationTags from './handler';
import {IGetOrganizationTagsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

describe('getOrganizationTags', () => {
  test("organization's tag returned", async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {organization} = await insertOrganizationForTest(context, userToken);
    const {tag: tag01} = await insertTagForTest(
      context,
      userToken,
      organization.resourceId
    );

    const {tag: tag02} = await insertTagForTest(
      context,
      userToken,
      organization.resourceId
    );

    const instData =
      RequestData.fromExpressRequest<IGetOrganizationTagsEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {organizationId: organization.resourceId}
      );

    const result = await getOrganizationTags(context, instData);
    assertEndpointResultOk(result);
    expect(result.tags).toContainEqual(tag01);
    expect(result.tags).toContainEqual(tag02);
  });
});
