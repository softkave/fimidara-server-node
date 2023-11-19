import {faker} from '@faker-js/faker';
import {add} from 'date-fns';
import {merge} from 'lodash';
import {Readable} from 'stream';
import {getMongoConnection} from '../../db/connection';
import {AgentToken} from '../../definitions/agentToken';
import {BaseTokenData, CURRENT_TOKEN_VERSION} from '../../definitions/system';
import {PublicUser, UserWithWorkspace} from '../../definitions/user';
import {PublicWorkspace, Workspace} from '../../definitions/workspace';
import {FileBackendType, FimidaraConfig} from '../../resources/types';
import {fimidaraConfig} from '../../resources/vars';
import {appAssert} from '../../utils/assertion';
import {getTimestamp} from '../../utils/dateFns';
import {toNonNullableArray} from '../../utils/fns';
import RequestData from '../RequestData';
import addAgentTokenEndpoint from '../agentTokens/addToken/handler';
import {
  AddAgentTokenEndpointParams,
  NewAgentTokenInput,
} from '../agentTokens/addToken/types';
import {assertAgentToken} from '../agentTokens/utils';
import {populateUserWorkspaces} from '../assignedItems/getAssignedItems';
import sendRequest from '../collaborationRequests/sendRequest/handler';
import {
  CollaborationRequestInput,
  SendCollaborationRequestEndpointParams,
} from '../collaborationRequests/sendRequest/types';
import BaseContext from '../contexts/BaseContext';
import {BaseContextType, IServerRequest} from '../contexts/types';
import {
  getLogicProviders,
  getMongoBackedSemanticDataProviders,
  getMongoDataProviders,
  getMongoModels,
} from '../contexts/utils';
import uploadFile from '../files/uploadFile/handler';
import {UploadFileEndpointParams} from '../files/uploadFile/types';
import addFolder from '../folders/addFolder/handler';
import {AddFolderEndpointParams, NewFolderInput} from '../folders/addFolder/types';
import {folderConstants} from '../folders/constants';
import {addRootnameToPath} from '../folders/utils';
import addPermissionGroup from '../permissionGroups/addPermissionGroup/handler';
import {
  AddPermissionGroupEndpointParams,
  NewPermissionGroupInput,
} from '../permissionGroups/addPermissionGroup/types';
import addPermissionItems from '../permissionItems/addItems/handler';
import {AddPermissionItemsEndpointParams} from '../permissionItems/addItems/types';
import {PermissionItemInput} from '../permissionItems/types';
import {setupApp} from '../runtime/initAppSetup';
import {BaseEndpointResult} from '../types';
import INTERNAL_confirmEmailAddress from '../users/confirmEmailAddress/internalConfirmEmailAddress';
import signup from '../users/signup/signup';
import {SignupEndpointParams} from '../users/signup/types';
import {assertUser} from '../users/utils';
import addWorkspace from '../workspaces/addWorkspace/handler';
import {AddWorkspaceEndpointParams} from '../workspaces/addWorkspace/types';
import {makeRootnameFromName} from '../workspaces/utils';
import MockTestEmailProviderContext from './context/MockTestEmailProviderContext';
import TestLocalFsFilePersistenceProviderContext from './context/TestLocalFsFilePersistenceProviderContext';
import TestMemoryFilePersistenceProviderContext from './context/TestMemoryFilePersistenceProviderContext';
import TestS3FilePersistenceProviderContext from './context/TestS3FilePersistenceProviderContext';
import {ITestBaseContext} from './context/types';
import {generateTestFileName} from './generateData/file';
import {generateTestFolderName} from './generateData/folder';
import sharp = require('sharp');
import assert = require('assert');

export function getTestEmailProvider(appVariables: FimidaraConfig) {
  return new MockTestEmailProviderContext();
}

export function getTestFileProvider(appVariables: FimidaraConfig) {
  if (appVariables.fileBackend === FileBackendType.S3) {
    return new TestS3FilePersistenceProviderContext(appVariables.awsRegion);
  } else if (appVariables.fileBackend === FileBackendType.Memory) {
    return new TestMemoryFilePersistenceProviderContext();
  } else if (appVariables.fileBackend === FileBackendType.LocalFs) {
    appAssert(appVariables.localFsDir);
    return new TestLocalFsFilePersistenceProviderContext(appVariables.localFsDir);
  }

  throw new Error(`Invalid file backend type ${appVariables.fileBackend}`);
}

export async function initTestBaseContext(): Promise<ITestBaseContext> {
  const connection = await getMongoConnection(
    fimidaraConfig.mongoDbURI,
    fimidaraConfig.mongoDbDatabaseName
  );
  const models = getMongoModels(connection);
  const data = getMongoDataProviders(models);
  const ctx = new BaseContext(
    data,
    getTestEmailProvider(fimidaraConfig),
    getTestFileProvider(fimidaraConfig),
    fimidaraConfig,
    getLogicProviders(),
    getMongoBackedSemanticDataProviders(data),
    connection,
    models,
    async () => {
      await connection.close();
    }
  );
  await ctx.init();
  await setupApp(ctx);
  return ctx;
}

export function assertContext(ctx: any): asserts ctx is BaseContextType {
  assert(ctx, 'Context is not yet initialized.');
}

export function assertEndpointResultOk(result: BaseEndpointResult) {
  if (result?.errors?.length) {
    throw result.errors;
  }
}

export function mockExpressRequest(token?: BaseTokenData) {
  const req: IServerRequest = {
    auth: token,
  } as unknown as IServerRequest;
  return req;
}

export function mockExpressRequestWithAgentToken(
  token: Pick<AgentToken, 'resourceId' | 'createdAt' | 'expires'>
) {
  const req: IServerRequest = {
    auth: {
      version: CURRENT_TOKEN_VERSION,
      sub: {id: token.resourceId},
      iat: token.createdAt,
      exp: token.expires,
    },
  } as unknown as IServerRequest;
  return req;
}

export function mockExpressRequestForPublicAgent() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const req: IServerRequest = {};
  return req;
}

export interface IInsertUserForTestResult {
  rawUser: UserWithWorkspace;
  userToken: AgentToken;
  user: PublicUser;
  userTokenStr: string;
  reqData: RequestData<SignupEndpointParams>;
}

export async function insertUserForTest(
  context: BaseContextType,
  userInput: Partial<SignupEndpointParams> = {},
  /** Tests that mutate data will fail otherwise */
  skipAutoVerifyEmail = false
): Promise<IInsertUserForTestResult> {
  const instData = RequestData.fromExpressRequest<SignupEndpointParams>(
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
  let rawUser: UserWithWorkspace;

  if (!skipAutoVerifyEmail) {
    const user = await INTERNAL_confirmEmailAddress(
      context,
      result.user.resourceId,
      null
    );
    rawUser = await populateUserWorkspaces(context, user);
  } else {
    const user = await context.semantic.user.getOneById(result.user.resourceId);
    assertUser(user);
    rawUser = await populateUserWorkspaces(context, user);
  }

  const tokenData = context.session.decodeToken(context, result.token);
  const userToken = await context.semantic.agentToken.getOneById(tokenData.sub.id);
  assertAgentToken(userToken);
  return {
    rawUser,
    userToken,
    user: {...result.user, isEmailVerified: rawUser.isEmailVerified},
    userTokenStr: result.token,
    reqData: instData,
  };
}

export interface IInsertWorkspaceForTestResult {
  workspace: PublicWorkspace;
  rawWorkspace: Workspace;
}

export async function insertWorkspaceForTest(
  context: BaseContextType,
  userToken: AgentToken,
  workspaceInput: Partial<AddWorkspaceEndpointParams> = {}
): Promise<IInsertWorkspaceForTestResult> {
  const companyName = faker.lorem.words(6);
  const instData = RequestData.fromExpressRequest<AddWorkspaceEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
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
  const rawWorkspace = await context.semantic.workspace.getOneById(
    result.workspace.resourceId
  );
  assert(rawWorkspace);
  return {rawWorkspace, workspace: result.workspace};
}

export async function insertPermissionGroupForTest(
  context: BaseContextType,
  userToken: AgentToken,
  workspaceId: string,
  permissionGroupInput: Partial<NewPermissionGroupInput> = {}
) {
  const instData = RequestData.fromExpressRequest<AddPermissionGroupEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      workspaceId,
      permissionGroup: {
        name: faker.lorem.words(3),
        description: faker.lorem.words(10),
        ...permissionGroupInput,
      },
    }
  );

  const result = await addPermissionGroup(context, instData);
  assertEndpointResultOk(result);
  return result;
}

export async function insertPermissionItemsForTest(
  context: BaseContextType,
  userToken: AgentToken,
  workspaceId: string,
  input: PermissionItemInput | PermissionItemInput[]
) {
  const instData = RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {workspaceId, items: toNonNullableArray(input)}
  );
  const result = await addPermissionItems(context, instData);
  assertEndpointResultOk(result);
  return result;
}

export async function insertRequestForTest(
  context: BaseContextType,
  userToken: AgentToken,
  workspaceId: string,
  requestInput: Partial<CollaborationRequestInput> = {}
) {
  const instData = RequestData.fromExpressRequest<SendCollaborationRequestEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      workspaceId,
      request: {
        recipientEmail: faker.internet.email(),
        message: faker.lorem.paragraph(),
        expires: getTimestamp(add(Date.now(), {days: 10})),
        ...requestInput,
      },
    }
  );

  const result = await sendRequest(context, instData);
  assertEndpointResultOk(result);
  return result;
}

export async function insertAgentTokenForTest(
  context: BaseContextType,
  userToken: AgentToken,
  workspaceId: string,
  tokenInput: Partial<NewAgentTokenInput> = {}
) {
  const instData = RequestData.fromExpressRequest<AddAgentTokenEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      workspaceId,
      token: {
        expires: getTimestamp(add(Date.now(), {days: 1})),
        name: faker.lorem.words(7),
        description: faker.lorem.words(10),
        ...tokenInput,
      },
    }
  );

  const result = await addAgentTokenEndpoint(context, instData);
  assertEndpointResultOk(result);
  return result;
}

export async function insertFolderForTest(
  context: BaseContextType,
  userToken: AgentToken | null,
  workspace: PublicWorkspace,
  folderInput: Partial<NewFolderInput> = {}
) {
  const instData = RequestData.fromExpressRequest<AddFolderEndpointParams>(
    userToken
      ? mockExpressRequestWithAgentToken(userToken)
      : mockExpressRequestForPublicAgent(),
    {
      folder: {
        folderpath: addRootnameToPath(
          [generateTestFolderName({includeStraySlashes: true})].join(
            folderConstants.nameSeparator
          ),
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

export async function generateTestImage(
  props: IGenerateImageProps = {width: 300, height: 200}
) {
  const imgBuffer = await sharp({
    create: {
      width: props.width,
      height: props.height,
      channels: 4,
      background: {r: 255, g: 0, b: 0, alpha: 0.5},
    },
  })
    .png()
    .toBuffer();
  const imgStream = sharp(imgBuffer).png();
  return {imgBuffer, imgStream};
}

export function generateTestTextFile() {
  const text = faker.lorem.paragraphs(10);
  const textBuffer = Buffer.from(text);
  const textStream = Readable.from([textBuffer]);
  return {textBuffer, textStream};
}

export async function insertFileForTest(
  context: BaseContextType,
  userToken: AgentToken | null, // Pass null for public agent
  workspace: Pick<Workspace, 'rootname'>,
  fileInput: Partial<UploadFileEndpointParams> = {},
  type: 'png' | 'txt' = 'png',
  imageProps?: IGenerateImageProps
) {
  const testBuffer = Buffer.from('Hello world!');
  const testStream = Readable.from([testBuffer]);
  const input: UploadFileEndpointParams = {
    filepath: addRootnameToPath(
      [generateTestFileName()].join(folderConstants.nameSeparator),
      workspace.rootname
    ),
    description: faker.lorem.paragraph(),
    data: testStream,
    mimetype: 'application/octet-stream',
    size: testBuffer.byteLength,
  };

  assert(input.filepath);
  let dataBuffer: Buffer | undefined = undefined;

  if (!fileInput.data) {
    if (type === 'png') {
      const {imgBuffer, imgStream} = await generateTestImage(imageProps);
      input.data = imgStream;
      input.size = imgBuffer.byteLength;
      input.mimetype = 'image/png';
      dataBuffer = imgBuffer;
    } else {
      const {textBuffer, textStream} = generateTestTextFile();
      input.data = textStream;
      input.size = textBuffer.byteLength;
      input.mimetype = 'text/plain';
      input.encoding = 'utf-8';
      dataBuffer = textBuffer;
    }
  }

  merge(input, fileInput);
  const instData = RequestData.fromExpressRequest<UploadFileEndpointParams>(
    userToken
      ? mockExpressRequestWithAgentToken(userToken)
      : mockExpressRequestForPublicAgent(),
    input
  );
  const result = await uploadFile(context, instData);
  assertEndpointResultOk(result);
  return {...result, dataBuffer, reqData: instData};
}
