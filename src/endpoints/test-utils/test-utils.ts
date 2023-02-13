import {faker} from '@faker-js/faker';
import {add} from 'date-fns';
import {getMongoConnection} from '../../db/connection';
import {IClientAssignedToken} from '../../definitions/clientAssignedToken';
import {PermissionItemAppliesTo} from '../../definitions/permissionItem';
import {
  AppResourceType,
  BasicCRUDActions,
  CURRENT_TOKEN_VERSION,
  getNonWorkspaceActionList,
  getWorkspaceActionList,
  IBaseTokenData,
  TokenType,
} from '../../definitions/system';
import {IPublicUserData, IUserWithWorkspace} from '../../definitions/user';
import {IUserToken} from '../../definitions/userToken';
import {IPublicWorkspace, IWorkspace} from '../../definitions/workspace';
import {extractEnvVariables, extractProdEnvsSchema, FileBackendType, IAppVariables} from '../../resources/vars';
import {populateUserWorkspaces} from '../assignedItems/getAssignedItems';
import addClientAssignedToken from '../clientAssignedTokens/addToken/handler';
import {
  IAddClientAssignedTokenEndpointParams,
  INewClientAssignedTokenInput,
} from '../clientAssignedTokens/addToken/types';
import sendRequest from '../collaborationRequests/sendRequest/handler';
import {
  ICollaborationRequestInput,
  ISendCollaborationRequestEndpointParams,
} from '../collaborationRequests/sendRequest/types';
import {IPermissionEntity} from '../contexts/authorization-checks/getPermissionEntities';
import BaseContext from '../contexts/BaseContext';
import {IBaseContext, IServerRequest} from '../contexts/types';
import {getDataProviders} from '../contexts/utils';
import uploadFile from '../files/uploadFile/handler';
import {IUploadFileEndpointParams} from '../files/uploadFile/types';
import {splitfilepathWithDetails} from '../files/utils';
import addFolder from '../folders/addFolder/handler';
import {IAddFolderEndpointParams, INewFolderInput} from '../folders/addFolder/types';
import {folderConstants} from '../folders/constants';
import {addRootnameToPath} from '../folders/utils';
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
import {IAddProgramAccessTokenEndpointParams, INewProgramAccessTokenInput} from '../programAccessTokens/addToken/types';
import EndpointReusableQueries from '../queries';
import RequestData from '../RequestData';
import {setupApp} from '../runtime/initAppSetup';
import {IBaseEndpointResult} from '../types';
import internalConfirmEmailAddress from '../user/confirmEmailAddress/internalConfirmEmailAddress';
import signup from '../user/signup/signup';
import {ISignupParams} from '../user/signup/types';
import UserTokenQueries from '../user/UserTokenQueries';
import addWorkspace from '../workspaces/addWorkspace/handler';
import {IAddWorkspaceEndpointParams} from '../workspaces/addWorkspace/types';
import {makeRootnameFromName} from '../workspaces/utils';
import MockTestEmailProviderContext from './context/MockTestEmailProviderContext';
import TestMemoryFilePersistenceProviderContext from './context/TestMemoryFilePersistenceProviderContext';
import TestS3FilePersistenceProviderContext from './context/TestS3FilePersistenceProviderContext';
import {ITestBaseContext} from './context/types';
import {generateTestFolderName} from './generate-data/folder';
import {expectPermissionItemsForEntityPresent} from './helpers/permissionItem';
import sharp = require('sharp');
import assert = require('assert');

export function getTestEmailProvider(appVariables: IAppVariables) {
  return new MockTestEmailProviderContext();
}

export async function getTestFileProvider(appVariables: IAppVariables) {
  if (appVariables.fileBackend === FileBackendType.S3) {
    const fileProvider = new TestS3FilePersistenceProviderContext(appVariables.awsRegion);
    return fileProvider;
  } else {
    return new TestMemoryFilePersistenceProviderContext();
  }
}

export async function initTestBaseContext(): Promise<ITestBaseContext> {
  const appVariables = extractEnvVariables(extractProdEnvsSchema);
  const connection = await getMongoConnection(appVariables.mongoDbURI, appVariables.mongoDbDatabaseName);
  const ctx = new BaseContext(
    getDataProviders(connection),
    getTestEmailProvider(appVariables),
    await getTestFileProvider(appVariables),
    appVariables,
    () => connection.close()
  );

  await setupApp(ctx);
  return ctx;
}

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
    auth: token,
  };
  return req;
}

export function mockExpressRequestWithUserToken(token: IUserToken) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const req: IServerRequest = {
    auth: {
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

export function mockExpressRequestWithClientToken(
  token: Pick<IClientAssignedToken, 'resourceId' | 'createdAt' | 'expires'>
) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const req: IServerRequest = {
    auth: {
      version: CURRENT_TOKEN_VERSION,
      sub: {
        id: token.resourceId,
        type: TokenType.ClientAssignedToken,
      },
      iat: new Date(token.createdAt).getTime(),
      exp: token.expires ? new Date(token.expires).valueOf() : undefined,
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
  const instData = RequestData.fromExpressRequest<ISignupParams>(mockExpressRequest(), {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    ...userInput,
  });

  const result = await signup(context, instData);
  assertEndpointResultOk(result);
  let rawUser: IUserWithWorkspace;
  if (!skipAutoVerifyEmail) {
    rawUser = await internalConfirmEmailAddress(context, result.user);
  } else {
    rawUser = await populateUserWorkspaces(
      context,
      await context.data.user.assertGetOneByQuery(EndpointReusableQueries.getByResourceId(result.user.resourceId))
    );
  }

  const tokenData = context.session.decodeToken(context, result.token);
  const userToken = await context.data.userToken.assertGetOneByQuery(UserTokenQueries.getById(tokenData.sub.id));
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
  workspaceInput: Partial<IAddWorkspaceEndpointParams> = {}
): Promise<IInsertWorkspaceForTestResult> {
  const companyName = faker.lorem.words(6);
  const instData = RequestData.fromExpressRequest<IAddWorkspaceEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      name: companyName,
      rootname: makeRootnameFromName(companyName),
      description: faker.company.catchPhraseDescriptor(),
      // usageThresholds: generateTestUsageThresholdInputMap(),
      ...workspaceInput,
    }
  );

  const result = await addWorkspace(context, instData);
  assertEndpointResultOk(result);
  const rawWorkspace = await context.data.workspace.getOneByQuery(
    EndpointReusableQueries.getByResourceId(result.workspace.resourceId)
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
  const instData = RequestData.fromExpressRequest<IAddPermissionGroupEndpointParams>(
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
  const instData = RequestData.fromExpressRequest<ISendCollaborationRequestEndpointParams>(
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
  const instData = RequestData.fromExpressRequest<IAddClientAssignedTokenEndpointParams>(
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
  const instData = RequestData.fromExpressRequest<IAddProgramAccessTokenEndpointParams>(
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

export interface ITestPermissionItemContainer {
  containerId: string;
  containerType: AppResourceType;
}

export interface ITestPermissionItemByEntityBase extends Partial<INewPermissionItemInputByEntity> {
  targetType: AppResourceType;
}

export function makeTestPermissionItemByEntityInputs(
  container: ITestPermissionItemContainer,
  base: ITestPermissionItemByEntityBase
) {
  const actionList =
    base.targetType === AppResourceType.Workspace || base.targetType === AppResourceType.All
      ? getWorkspaceActionList()
      : getNonWorkspaceActionList();

  const items: INewPermissionItemInputByEntity[] = actionList.map(action => ({
    ...base,
    ...container,
    action: action as BasicCRUDActions,
    grantAccess: faker.datatype.boolean(),
    appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
  }));

  return items;
}

export async function insertPermissionItemsForTestByEntity(
  context: IBaseContext,
  userToken: IUserToken,
  workspaceId: string,
  entity: IPermissionEntity,
  container: ITestPermissionItemContainer,
  base: ITestPermissionItemByEntityBase
) {
  const itemsInput = makeTestPermissionItemByEntityInputs(container, base);
  const instData = RequestData.fromExpressRequest<IReplacePermissionItemsByEntityEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      ...entity,
      workspaceId: workspaceId,
      items: itemsInput,
    }
  );

  const result = await replacePermissionItemsByEntity(context, instData);
  assertEndpointResultOk(result);
  expectPermissionItemsForEntityPresent(
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
  const instData = RequestData.fromExpressRequest<IReplacePermissionItemsByEntityEndpointParams>(
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
  workspace: IWorkspace,
  folderInput: Partial<INewFolderInput> = {}
) {
  const instData = RequestData.fromExpressRequest<IAddFolderEndpointParams>(
    userToken ? mockExpressRequestWithUserToken(userToken) : mockExpressRequestForPublicAgent(),
    {
      folder: {
        folderpath: addRootnameToPath(
          [generateTestFolderName()].join(folderConstants.nameSeparator),
          workspace.rootname
        ),
        description: faker.lorem.paragraph(),
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

export async function generateTestImage(props: IGenerateImageProps = {width: 300, height: 200}) {
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
  workspace: IWorkspace,
  fileInput: Partial<IUploadFileEndpointParams> = {},
  type: 'png' | 'txt' = 'png',
  imageProps?: IGenerateImageProps
) {
  const input: IUploadFileEndpointParams = {
    filepath: addRootnameToPath([generateTestFolderName()].join(folderConstants.nameSeparator), workspace.rootname),
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
    userToken ? mockExpressRequestWithUserToken(userToken) : mockExpressRequestForPublicAgent(),
    input
  );

  const result = await uploadFile(context, instData);
  assertEndpointResultOk(result);
  return {...result, buffer: input.data, reqData: instData};
}
