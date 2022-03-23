import assert = require('assert');
import {add} from 'date-fns';
import * as faker from 'faker';
import sharp = require('sharp');
import {getMongoConnection} from '../../db/connection';
import {IPublicOrganization} from '../../definitions/organization';
import {
  AppResourceType,
  BasicCRUDActions,
  crudActionsList,
} from '../../definitions/system';
import {IUser} from '../../definitions/user';
import {IUserToken} from '../../definitions/userToken';
import singletonFunc from '../../utilities/singletonFunc';
import addClientAssignedToken from '../clientAssignedTokens/addToken/handler';
import {
  IAddClientAssignedTokenParams,
  INewClientAssignedTokenInput,
} from '../clientAssignedTokens/addToken/types';
import sendRequest from '../collaborationRequests/sendRequest/handler';
import {
  ICollaborationRequestInput,
  ISendRequestParams,
} from '../collaborationRequests/sendRequest/types';
import {IPermissionEntity} from '../contexts/authorization-checks/getPermissionEntities';
import BaseContext, {IBaseContext} from '../contexts/BaseContext';
import MemoryDataProviderContext from '../contexts/MemoryDataProviderContext';
import MongoDBDataProviderContext from '../contexts/MongoDBDataProviderContext';
import {
  CURRENT_TOKEN_VERSION,
  IBaseTokenData,
  TokenType,
} from '../contexts/SessionContext';
import {IServerRequest} from '../contexts/types';
import uploadFile from '../files/uploadFile/handler';
import {IUploadFileParams} from '../files/uploadFile/types';
import addFolder from '../folders/addFolder/handler';
import {IAddFolderParams, INewFolderInput} from '../folders/addFolder/types';
import {folderConstants} from '../folders/constants';
import addOrganization from '../organizations/addOrganization/handler';
import {IAddOrganizationParams} from '../organizations/addOrganization/types';
import replacePermissionItemsByEntity from '../permissionItems/replaceItemsByEntity/handler';
import {
  IReplacePermissionItemsByEntityParams,
  INewPermissionItemInputByEntity,
} from '../permissionItems/replaceItemsByEntity/types';
import addPresetPermissionsGroup from '../presetPermissionsGroups/addPreset/handler';
import {
  IAddPresetPermissionsGroupParams,
  INewPresetPermissionsGroupInput,
} from '../presetPermissionsGroups/addPreset/types';
import addProgramAccessToken from '../programAccessTokens/addToken/handler';
import {
  IAddProgramAccessTokenParams,
  INewProgramAccessTokenInput,
} from '../programAccessTokens/addToken/types';
import EndpointReusableQueries from '../queries';
import RequestData from '../RequestData';
import {setupApp} from '../runtime/initAppSetup';
import {IBaseEndpointResult} from '../types';
import signup from '../user/signup/signup';
import {ISignupParams} from '../user/signup/types';
import {IPublicUserData} from '../user/types';
import UserTokenQueries from '../user/UserTokenQueries';
import MockTestEmailProviderContext from './context/MockTestEmailProviderContext';
import TestMemoryFilePersistenceProviderContext from './context/TestMemoryFilePersistenceProviderContext';
import TestS3FilePersistenceProviderContext from './context/TestS3FilePersistenceProviderContext';
import TestSESEmailProviderContext from './context/TestSESEmailProviderContext';
import {ITestBaseContext} from './context/types';
import {expectItemsContain} from './helpers/permissionItem';
import {getTestVars, ITestVariables, TestDataProviderType} from './vars';

async function getTestDataProvider(appVariables: ITestVariables) {
  if (appVariables.dataProviderType === TestDataProviderType.Mongo) {
    const connection = await getMongoConnection(
      appVariables.mongoDbURI,
      appVariables.mongoDbDatabaseName
    );

    return new MongoDBDataProviderContext(connection);
  } else {
    return new MemoryDataProviderContext();
  }
}

function getTestEmailProvider(appVariables: ITestVariables) {
  if (appVariables.useSESEmailProvider) {
    return new TestSESEmailProviderContext(appVariables.awsRegion);
  } else {
    return new MockTestEmailProviderContext();
  }
}

async function getTestFileProvider(appVariables: ITestVariables) {
  if (appVariables.useS3FileProvider) {
    const fileProvider = new TestS3FilePersistenceProviderContext(
      appVariables.awsRegion
    );
    // await ensureAppBucketsReady(fileProvider, appVariables);
    return fileProvider;
  } else {
    return new TestMemoryFilePersistenceProviderContext();
  }
}

async function waitForCleanup(promises: Promise<any>[]) {
  const result = await Promise.allSettled(promises);
  result.forEach(item => {
    if (item.status === 'rejected') {
      console.error(item.reason);
    }
  });
}

async function disposeTestBaseContext(ctxPromise: Promise<IBaseContext>) {
  const ctx = await ctxPromise;
  const promises: Promise<any>[] = [];

  if (ctx.data instanceof MongoDBDataProviderContext) {
    promises.push(ctx.data.closeConnection());
  }

  if (ctx.fileBackend instanceof TestS3FilePersistenceProviderContext) {
    // promises.push(ctx.fileBackend.cleanupBucket(ctx.appVariables.S3Bucket));
    promises.push(ctx.fileBackend.close());
  }

  if (ctx.email instanceof TestSESEmailProviderContext) {
    ctx.email.close();
  }

  await waitForCleanup(promises);
}

export async function initTestBaseContext(): Promise<ITestBaseContext> {
  const appVariables = getTestVars();
  const ctx = new BaseContext(
    await getTestDataProvider(appVariables),
    getTestEmailProvider(appVariables),
    await getTestFileProvider(appVariables),
    appVariables
  );

  await setupApp(ctx);
  return ctx;
}

export const getTestBaseContext = singletonFunc(
  initTestBaseContext,
  disposeTestBaseContext
);

export function assertContext(ctx: any): asserts ctx is IBaseContext {
  assert(ctx, 'Context is not yet initialized.');
}

export function assertEndpointResultOk(result: IBaseEndpointResult) {
  if (result?.errors?.length) {
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
        id: token.resourceId,
        type: TokenType.UserToken,
      },
      iat: new Date(token.issuedAt).getTime(),
      exp: token.expires,
    },
  };

  return req;
}

export function mockExpressRequestForPublicAgent() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const req: IServerRequest = {};
  return req;
}

export interface IInsertUserForTestResult {
  rawUser: IUser;
  userToken: IUserToken;
  user: IPublicUserData;
  userTokenStr: string;
  reqData: RequestData<ISignupParams>;
}

export async function insertUserForTest(
  context: IBaseContext,
  userInput: Partial<ISignupParams> = {}
): Promise<IInsertUserForTestResult> {
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
  assertEndpointResultOk(result);
  const tokenData = context.session.decodeToken(context, result.token);
  const userToken = await context.data.userToken.assertGetItem(
    UserTokenQueries.getById(tokenData.sub.id)
  );

  const rawUser = await context.data.user.assertGetItem(
    EndpointReusableQueries.getById(result.user.resourceId)
  );

  return {
    rawUser,
    userToken,
    user: result.user,
    userTokenStr: result.token,
    reqData: instData,
  };
}

export interface IInsertOrganizationForTestResult {
  organization: IPublicOrganization;
}

export async function insertOrganizationForTest(
  context: IBaseContext,
  userToken: IUserToken,
  orgInput: Partial<IAddOrganizationParams> = {}
): Promise<IInsertOrganizationForTestResult> {
  const instData = RequestData.fromExpressRequest<IAddOrganizationParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      name: faker.company.companyName(),
      description: faker.company.catchPhraseDescriptor(),
      ...orgInput,
    }
  );

  const result = await addOrganization(context, instData);
  assertEndpointResultOk(result);
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
  const instData =
    RequestData.fromExpressRequest<IAddPresetPermissionsGroupParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        organizationId,
        preset: {
          name: faker.lorem.words(3),
          description: faker.lorem.words(10),
          presets: [],
          ...presetInput,
        },
      }
    );

  const result = await addPresetPermissionsGroup(context, instData);
  assertEndpointResultOk(result);
  return result;
}

export async function insertRequestForTest(
  context: IBaseContext,
  userToken: IUserToken,
  organizationId: string,
  requestInput: Partial<ICollaborationRequestInput> = {}
) {
  const instData = RequestData.fromExpressRequest<ISendRequestParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId,
      request: {
        recipientEmail: faker.internet.email(),
        message: faker.lorem.paragraph(),
        expires: add(Date.now(), {days: 10}).toISOString(),
        ...requestInput,
      },
    }
  );

  const result = await sendRequest(context, instData);
  assertEndpointResultOk(result);
  return result;
}

export async function insertClientAssignedTokenForTest(
  context: IBaseContext,
  userToken: IUserToken,
  organizationId: string,
  requestInput: Partial<INewClientAssignedTokenInput> = {}
) {
  const instData =
    RequestData.fromExpressRequest<IAddClientAssignedTokenParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        organizationId,
        token: {
          presets: [],
          expires: add(Date.now(), {days: 1}).toISOString(),
          ...requestInput,
        },
      }
    );

  const result = await addClientAssignedToken(context, instData);
  assertEndpointResultOk(result);
  return result;
}

export async function insertProgramAccessTokenForTest(
  context: IBaseContext,
  userToken: IUserToken,
  organizationId: string,
  tokenInput: Partial<INewProgramAccessTokenInput> = {}
) {
  const instData = RequestData.fromExpressRequest<IAddProgramAccessTokenParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId,
      token: {
        name: faker.lorem.words(2),
        description: faker.lorem.words(10),
        presets: [],
        ...tokenInput,
      },
    }
  );

  const result = await addProgramAccessToken(context, instData);
  assertEndpointResultOk(result);
  return result;
}

export interface ITestPermissionItemOwner {
  permissionOwnerId: string;
  permissionOwnerType: AppResourceType;
}

export interface ITestPermissionItemBase
  extends Partial<INewPermissionItemInputByEntity> {
  itemResourceType: AppResourceType;
}

export function makeTestPermissionItemInputs(
  owner: ITestPermissionItemOwner,
  base: ITestPermissionItemBase
) {
  const items: INewPermissionItemInputByEntity[] = crudActionsList.map(
    action => ({
      ...base,
      ...owner,
      action: action as BasicCRUDActions,
      isExclusion: faker.datatype.boolean(),
      isForPermissionOwnerOnly: faker.datatype.boolean(),
    })
  );

  return items;
}

export async function insertPermissionItemsForTestUsingOwnerAndBase(
  context: IBaseContext,
  userToken: IUserToken,
  organizationId: string,
  entity: IPermissionEntity,
  owner: ITestPermissionItemOwner,
  base: ITestPermissionItemBase
) {
  const itemsInput = makeTestPermissionItemInputs(owner, base);
  const instData =
    RequestData.fromExpressRequest<IReplacePermissionItemsByEntityParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        ...entity,
        organizationId: organizationId,
        items: itemsInput,
      }
    );

  const result = await replacePermissionItemsByEntity(context, instData);
  assertEndpointResultOk(result);
  expectItemsContain(result.items, itemsInput);
  return result;
}

export async function insertPermissionItemsForTestUsingItems(
  context: IBaseContext,
  userToken: IUserToken,
  organizationId: string,
  entity: IPermissionEntity,
  items: INewPermissionItemInputByEntity[]
) {
  const instData =
    RequestData.fromExpressRequest<IReplacePermissionItemsByEntityParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        ...entity,
        items,
        organizationId: organizationId,
      }
    );

  const result = await replacePermissionItemsByEntity(context, instData);
  assertEndpointResultOk(result);
  expect(result.items.length).toEqual(items.length);
  return result;
}

export async function insertFolderForTest(
  context: IBaseContext,
  userToken: IUserToken | null,
  organizationId: string,
  folderInput: Partial<INewFolderInput> = {}
) {
  const instData = RequestData.fromExpressRequest<IAddFolderParams>(
    userToken
      ? mockExpressRequestWithUserToken(userToken)
      : mockExpressRequestForPublicAgent(),
    {
      organizationId,
      folder: {
        path: [faker.lorem.word()].join(folderConstants.nameSeparator),
        description: faker.lorem.paragraph(),
        maxFileSizeInBytes: 1_000_000_000,
        ...folderInput,
      },
    }
  );

  const result = await addFolder(context, instData);
  assertEndpointResultOk(result);
  return result;
}

export interface IGenerateImageProps {
  width: number;
  height: number;
}

export async function generateTestImage(
  props: IGenerateImageProps = {width: 300, height: 200}
) {
  return await sharp({
    create: {
      width: props.width,
      height: props.height,
      channels: 4,
      background: {r: 255, g: 0, b: 0, alpha: 0.5},
    },
  })
    .png()
    .toBuffer();
}

export function generateTestTextFile() {
  const text = faker.lorem.paragraphs(10);
  return Buffer.from(text, 'utf-8');
}

export async function insertFileForTest(
  context: IBaseContext,
  userToken: IUserToken | null, // Pass null for public agent
  organizationId: string,
  fileInput: Partial<IUploadFileParams> = {},
  type: 'image' | 'text' = 'image',
  imageProps?: IGenerateImageProps
) {
  const input: IUploadFileParams = {
    organizationId,
    path: [faker.lorem.word()].join(folderConstants.nameSeparator),
    description: faker.lorem.paragraph(),
    data: Buffer.from(''), // to fulfill all TS righteousness
    mimetype: 'application/octet-stream',
    ...fileInput,
  };

  if (!fileInput.data) {
    if (type === 'image') {
      input.data = await generateTestImage(imageProps);
      input.mimetype = 'image/png';
      input.extension = 'png';
      input.path = input.path + '.png';
    } else {
      input.data = generateTestTextFile();
      input.mimetype = 'text/plain';
      input.encoding = 'utf-8';
      input.extension = 'txt';
      input.path = input.path + '.txt';
    }
  }

  const instData = RequestData.fromExpressRequest<IUploadFileParams>(
    userToken
      ? mockExpressRequestWithUserToken(userToken)
      : mockExpressRequestForPublicAgent(),
    input
  );

  const result = await uploadFile(context, instData);
  assertEndpointResultOk(result);
  return {...result, buffer: input.data};
}
