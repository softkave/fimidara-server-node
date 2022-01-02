import * as faker from 'faker';
import {IUserToken} from '../definitions/userToken';
import BaseContext, {IBaseContext} from './contexts/BaseContext';
import {TestEmailProviderContext} from './contexts/EmailProviderContext';
import {TestFilePersistenceProviderContext} from './contexts/FilePersistenceProviderContext';
import MemoryDataProviderContext from './contexts/MemoryDataProviderContext';
import {
  CURRENT_TOKEN_VERSION,
  IBaseTokenData,
  TokenType,
} from './contexts/SessionContext';
import {IServerRequest} from './contexts/types';
import addOrganization from './organizations/addOrganization/handler';
import {IAddOrganizationParams} from './organizations/addOrganization/types';
import addPresetPermissionsGroup from './presetPermissionsGroups/addPreset/handler';
import {
  IAddPresetPermissionsGroupParams,
  INewPresetPermissionsGroupInput,
} from './presetPermissionsGroups/addPreset/types';
import RequestData from './RequestData';
import {IBaseEndpointResult} from './types';
import signup from './user/signup/signup';
import {ISignupParams} from './user/signup/types';
import UserTokenQueries from './user/UserTokenQueries';

export function getTestBaseContext() {
  return new BaseContext(
    new MemoryDataProviderContext(),
    new TestEmailProviderContext(),
    new TestFilePersistenceProviderContext()
  );
}

export function assertEndpointResultHasNoErrors(result: IBaseEndpointResult) {
  if (result.errors?.length) {
    throw result.errors;
  }
}

export function mockExpressRequest(token?: IBaseTokenData) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const req: IServerRequest = {
    user: token,
  };

  return req;
}

export function mockExpressRequestWithUserToken(token: IUserToken) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const req: IServerRequest = {
    user: {
      version: CURRENT_TOKEN_VERSION,
      sub: {
        id: token.tokenId,
        type: TokenType.UserToken,
      },
      iat: new Date(token.issuedAt).getTime(),
      exp: token.expires,
    },
  };

  return req;
}

export async function insertUserForTest(
  context: IBaseContext,
  userInput: Partial<ISignupParams> = {}
) {
  const instData = RequestData.fromExpressRequest<ISignupParams>(
    mockExpressRequest(),
    {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      ...userInput,
    }
  );

  const result = await signup(context, instData);
  assertEndpointResultHasNoErrors(result);

  const tokenData = context.session.decodeToken(context, result.token);
  const userToken = await context.data.userToken.assertGetItem(
    UserTokenQueries.getById(tokenData.sub.id)
  );

  return {
    userToken,
    user: result.user,
    userTokenStr: result.token,
  };
}

export async function insertOrganizationForTest(
  context: IBaseContext,
  userToken: IUserToken,
  orgInput: Partial<IAddOrganizationParams> = {}
) {
  const instData = RequestData.fromExpressRequest<IAddOrganizationParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      name: faker.company.companyName(),
      description: faker.company.catchPhraseDescriptor(),
      ...orgInput,
    }
  );

  const result = await addOrganization(context, instData);
  assertEndpointResultHasNoErrors(result);
  return {
    organization: result.organization,
  };
}

export async function insertPresetForTest(
  context: IBaseContext,
  userToken: IUserToken,
  organizationId: string,
  presetInput: Partial<INewPresetPermissionsGroupInput> = {}
) {
  const instData = RequestData.fromExpressRequest<IAddPresetPermissionsGroupParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId,
      preset: {
        name: faker.lorem.sentence(20),
        description: faker.lorem.sentence(50),
        presets: [],
        ...presetInput,
      },
    }
  );

  const result = await addPresetPermissionsGroup(context, instData);
  assertEndpointResultHasNoErrors(result);
  return result;
}
