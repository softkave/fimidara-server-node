import assert = require('assert');
import {faker} from '@faker-js/faker';
import {add} from 'date-fns';
import {getMongoConnection} from '../../db/connection';
import {PermissionItemAppliesTo} from '../../definitions/permissionItem';
import {
  AppResourceType,
  BasicCRUDActions,
  getNonWorkspaceActionList,
  getWorkspaceActionList,
} from '../../definitions/system';
import {IPublicUserData, IUserWithWorkspace} from '../../definitions/user';
import {IUserToken} from '../../definitions/userToken';
import {IPublicWorkspace, IWorkspace} from '../../definitions/workspace';
import singletonFunc from '../../utilities/singletonFunc';
import {withUserWorkspaces} from '../assignedItems/getAssignedItems';
import addClientAssignedToken from '../clientAssignedTokens/addToken/handler';
import {
  IAddClientAssignedTokenEndpointParams,
  INewClientAssignedTokenInput,
} from '../clientAssignedTokens/addToken/types';
import sendRequest from '../collaborationRequests/sendRequest/handler';
import {
  ICollaborationRequestInput,
  ISendRequestEndpointParams,
} from '../collaborationRequests/sendRequest/types';
import {IPermissionEntity} from '../contexts/authorization-checks/getPermissionEntities';
import BaseContext, {
  getCacheProviders,
  getDataProviders,
  getLogicProviders,
  IBaseContext,
} from '../contexts/BaseContext';
import MongoDBDataProviderContext from '../contexts/MongoDBDataProviderContext';
import {
  CURRENT_TOKEN_VERSION,
  IBaseTokenData,
  TokenType,
} from '../contexts/SessionContext';
import {IServerRequest} from '../contexts/types';
import uploadFile from '../files/uploadFile/handler';
import {IUploadFileEndpointParams} from '../files/uploadFile/types';
import {splitfilepathWithDetails} from '../files/utils';
import addFolder from '../folders/addFolder/handler';
import {
  IAddFolderEndpointParams,
  INewFolderInput,
} from '../folders/addFolder/types';
import {folderConstants} from '../folders/constants';
import addPermissionGroup from '../permissionGroups/addPermissionGroup/handler';
import {
  IAddPermissionGroupEndpointParams,
  INewPermissionGroupInput,
} from '../permissionGroups/addPermissionGroup/types';
import replacePermissionItemsByEntity from '../permissionItems/replaceItemsByEntity/handler';
import {
  INewPermissionItemInputByEntity,
  IReplacePermissionItemsByEntityEndpointParams,
} from '../permissionItems/replaceItemsByEntity/types';
import addProgramAccessToken from '../programAccessTokens/addToken/handler';
import {
  IAddProgramAccessTokenEndpointParams,
  INewProgramAccessTokenInput,
} from '../programAccessTokens/addToken/types';
import EndpointReusableQueries from '../queries';
import RequestData from '../RequestData';
import {setupApp} from '../runtime/initAppSetup';
import {IBaseEndpointResult} from '../types';
import internalConfirmEmailAddress from '../user/confirmEmailAddress/internalConfirmEmailAddress';
import signup from '../user/signup/signup';
import {ISignupParams} from '../user/signup/types';
import UserTokenQueries from '../user/UserTokenQueries';
import addWorkspace from '../workspaces/addWorkspace/handler';
import {IAddWorkspaceParams} from '../workspaces/addWorkspace/types';
import MockTestEmailProviderContext from './context/MockTestEmailProviderContext';
import TestMemoryFilePersistenceProviderContext from './context/TestMemoryFilePersistenceProviderContext';
import TestS3FilePersistenceProviderContext from './context/TestS3FilePersistenceProviderContext';
import TestSESEmailProviderContext from './context/TestSESEmailProviderContext';
import {ITestBaseContext} from './context/types';
import {generateUsageThresholdMap} from './generate-data/workspace';
import {expectItemsByEntityPresent} from './helpers/permissionItem';
import {getTestVars, ITestVariables} from './vars';
import sharp = require('sharp');

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
  const connection = await getMongoConnection(
    appVariables.mongoDbURI,
    appVariables.mongoDbDatabaseName
  );

  const ctx = new BaseContext(
    new MongoDBDataProviderContext(connection),
    getTestEmailProvider(appVariables),
    await getTestFileProvider(appVariables),
    appVariables,
    getDataProviders(connection),
    getCacheProviders(),
    getLogicProviders()
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
  rawUser: IUserWithWorkspace;
  userToken: IUserToken;
  user: IPublicUserData;
  userTokenStr: string;
  reqData: RequestData<ISignupParams>;
}

export async function insertUserForTest(
  context: IBaseContext,
  userInput: Partial<ISignupParams> = {},
  skipAutoVerifyEmail = false // Tests that mutate data will fail otherwise
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
  let rawUser: IUserWithWorkspace;

  if (!skipAutoVerifyEmail) {
    rawUser = await internalConfirmEmailAddress(context, result.user);
  } else {
    rawUser = await withUserWorkspaces(
      context,
      await context.data.user.assertGetItem(
        EndpointReusableQueries.getById(result.user.resourceId)
      )
    );
  }

  const tokenData = context.session.decodeToken(context, result.token);
  const userToken = await context.data.userToken.assertGetItem(
    UserTokenQueries.getById(tokenData.sub.id)
  );

  return {
    rawUser,
    userToken,
    user: {...result.user, isEmailVerified: rawUser.isEmailVerified},
    userTokenStr: result.token,
    reqData: instData,
  };
}

export interface IInsertWorkspaceForTestResult {
  workspace: IPublicWorkspace;
  rawWorkspace: IWorkspace;
}

export async function insertWorkspaceForTest(
  context: IBaseContext,
  userToken: IUserToken,
  workspaceInput: Partial<IAddWorkspaceParams> = {}
): Promise<IInsertWorkspaceForTestResult> {
  const instData = RequestData.fromExpressRequest<IAddWorkspaceParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      name: faker.company.companyName(),
      description: faker.company.catchPhraseDescriptor(),
      usageThresholds: generateUsageThresholdMap(),
      ...workspaceInput,
    }
  );

  const result = await addWorkspace(context, instData);
  assertEndpointResultOk(result);
  const rawWorkspace = await context.cacheProviders.workspace.getById(
    context,
    result.workspace.resourceId
  );
  assert(rawWorkspace);
  return {rawWorkspace, workspace: result.workspace};
}

export async function insertPermissionGroupForTest(
  context: IBaseContext,
  userToken: IUserToken,
  workspaceId: string,
  permissionGroupInput: Partial<INewPermissionGroupInput> = {}
) {
  const instData =
    RequestData.fromExpressRequest<IAddPermissionGroupEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        workspaceId,
        permissionGroup: {
          name: faker.lorem.words(3),
          description: faker.lorem.words(10),
          permissionGroups: [],
          ...permissionGroupInput,
        },
      }
    );

  const result = await addPermissionGroup(context, instData);
  assertEndpointResultOk(result);
  return result;
}

export async function insertRequestForTest(
  context: IBaseContext,
  userToken: IUserToken,
  workspaceId: string,
  requestInput: Partial<ICollaborationRequestInput> = {}
) {
  const instData = RequestData.fromExpressRequest<ISendRequestEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      workspaceId,
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
  workspaceId: string,
  requestInput: Partial<INewClientAssignedTokenInput> = {}
) {
  const instData =
    RequestData.fromExpressRequest<IAddClientAssignedTokenEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        workspaceId,
        token: {
          permissionGroups: [],
          expires: add(Date.now(), {days: 1}).toISOString(),
          name: faker.lorem.words(3),
          description: faker.lorem.words(10),
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
  workspaceId: string,
  tokenInput: Partial<INewProgramAccessTokenInput> = {}
) {
  const instData =
    RequestData.fromExpressRequest<IAddProgramAccessTokenEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        workspaceId,
        token: {
          name: faker.lorem.words(2),
          description: faker.lorem.words(10),
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

export interface ITestPermissionItemByEntityBase
  extends Partial<INewPermissionItemInputByEntity> {
  itemResourceType: AppResourceType;
}

export function makeTestPermissionItemByEntityInputs(
  owner: ITestPermissionItemOwner,
  base: ITestPermissionItemByEntityBase
) {
  const actionList =
    base.itemResourceType === AppResourceType.Workspace ||
    base.itemResourceType === AppResourceType.All
      ? getWorkspaceActionList()
      : getNonWorkspaceActionList();

  const items: INewPermissionItemInputByEntity[] = actionList.map(action => ({
    ...base,
    ...owner,
    action: action as BasicCRUDActions,
    grantAccess: faker.datatype.boolean(),
    appliesTo: PermissionItemAppliesTo.OwnerAndChildren,
  }));

  return items;
}

export async function insertPermissionItemsForTestByEntity(
  context: IBaseContext,
  userToken: IUserToken,
  workspaceId: string,
  entity: IPermissionEntity,
  owner: ITestPermissionItemOwner,
  base: ITestPermissionItemByEntityBase
) {
  const itemsInput = makeTestPermissionItemByEntityInputs(owner, base);
  const instData =
    RequestData.fromExpressRequest<IReplacePermissionItemsByEntityEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        ...entity,
        workspaceId: workspaceId,
        items: itemsInput,
      }
    );

  const result = await replacePermissionItemsByEntity(context, instData);
  assertEndpointResultOk(result);
  expectItemsByEntityPresent(
    result.items,
    itemsInput,
    entity.permissionEntityId,
    entity.permissionEntityType
  );

  return result;
}

export async function insertPermissionItemsForTestUsingItems(
  context: IBaseContext,
  userToken: IUserToken,
  workspaceId: string,
  entity: IPermissionEntity,
  items: INewPermissionItemInputByEntity[]
) {
  const instData =
    RequestData.fromExpressRequest<IReplacePermissionItemsByEntityEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        ...entity,
        items,
        workspaceId: workspaceId,
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
  workspaceId: string,
  folderInput: Partial<INewFolderInput> = {}
) {
  const instData = RequestData.fromExpressRequest<IAddFolderEndpointParams>(
    userToken
      ? mockExpressRequestWithUserToken(userToken)
      : mockExpressRequestForPublicAgent(),
    {
      workspaceId,
      folder: {
        folderpath: [faker.lorem.word()].join(folderConstants.nameSeparator),
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
  workspaceId: string,
  fileInput: Partial<IUploadFileEndpointParams> = {},
  type: 'png' | 'txt' = 'png',
  imageProps?: IGenerateImageProps
) {
  const input: IUploadFileEndpointParams = {
    workspaceId,
    filepath: [faker.lorem.word()].join(folderConstants.nameSeparator),
    description: faker.lorem.paragraph(),
    data: Buffer.from(''), // to fulfill all TS righteousness
    mimetype: 'application/octet-stream',
    ...fileInput,
  };

  assert(input.filepath);

  if (!fileInput.data) {
    if (type === 'png') {
      input.data = await generateTestImage(imageProps);
      input.mimetype = 'image/png';
      input.extension = 'png';
    } else {
      input.data = generateTestTextFile();
      input.mimetype = 'text/plain';
      input.encoding = 'utf-8';
      input.extension = 'txt';
    }
  }

  const pathWithDetails = splitfilepathWithDetails(input.filepath);

  if (!pathWithDetails.extension) {
    input.filepath = input.filepath + '.' + input.extension;
  }

  const instData = RequestData.fromExpressRequest<IUploadFileEndpointParams>(
    userToken
      ? mockExpressRequestWithUserToken(userToken)
      : mockExpressRequestForPublicAgent(),
    input
  );

  const result = await uploadFile(context, instData);
  assertEndpointResultOk(result);
  return {...result, buffer: input.data};
}
