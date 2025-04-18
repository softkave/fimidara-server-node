import {faker} from '@faker-js/faker';
import * as argon2 from 'argon2';
import assert from 'assert';
import {add} from 'date-fns';
import {isNumber} from 'lodash-es';
import {Readable} from 'stream';
import {globalSetup} from '../../contexts/globalUtils.js';
import {kIjxSemantic, kIjxUtils} from '../../contexts/ijx/injectables.js';
import {IServerRequest} from '../../contexts/types.js';
import {AgentToken, PublicAgentToken} from '../../definitions/agentToken.js';
import {
  BaseTokenData,
  kCurrentJWTTokenVersion,
  SessionAgent,
} from '../../definitions/system.js';
import {PublicUser, UserWithWorkspace} from '../../definitions/user.js';
import {PublicWorkspace, Workspace} from '../../definitions/workspace.js';
import {FimidaraSuppliedConfig} from '../../resources/config.js';
import {kPublicSessionAgent, kSystemSessionAgent} from '../../utils/agent.js';
import {appAssert} from '../../utils/assertion.js';
import {getTimestamp} from '../../utils/dateFns.js';
import {convertToArray, mergeData, pathJoin} from '../../utils/fns.js';
import {makeUserSessionAgent} from '../../utils/sessionUtils.js';
import addAgentTokenEndpoint from '../agentTokens/addToken/handler.js';
import {AddAgentTokenEndpointParams} from '../agentTokens/addToken/types.js';
import {assertAgentToken} from '../agentTokens/utils.js';
import {populateUserWorkspaces} from '../assignedItems/getAssignedItems.js';
import sendRequest from '../collaborationRequests/sendRequest/handler.js';
import {
  CollaborationRequestInput,
  SendCollaborationRequestEndpointParams,
} from '../collaborationRequests/sendRequest/types.js';
import addFileBackendConfig from '../fileBackends/addConfig/handler.js';
import {
  AddFileBackendConfigEndpointParams,
  NewFileBackendConfigInput,
} from '../fileBackends/addConfig/types.js';
import addFileBackendMountEndpoint from '../fileBackends/addMount/handler.js';
import {
  AddFileBackendMountEndpointParams,
  NewFileBackendMountInput,
} from '../fileBackends/addMount/types.js';
import uploadFile from '../files/uploadFile/handler.js';
import {UploadFileEndpointParams} from '../files/uploadFile/types.js';
import addFolder from '../folders/addFolder/handler.js';
import {
  AddFolderEndpointParams,
  NewFolderInput,
} from '../folders/addFolder/types.js';
import {addRootnameToPath} from '../folders/utils.js';
import addPermissionGroup from '../permissionGroups/addPermissionGroup/handler.js';
import {
  AddPermissionGroupEndpointParams,
  NewPermissionGroupInput,
} from '../permissionGroups/addPermissionGroup/types.js';
import addPermissionItems from '../permissionItems/addItems/handler.js';
import {AddPermissionItemsEndpointParams} from '../permissionItems/addItems/types.js';
import {PermissionItemInput} from '../permissionItems/types.js';
import EndpointReusableQueries from '../queries.js';
import RequestData from '../RequestData.js';
import {initFimidara} from '../runtime/initFimidara.js';
import {BaseEndpointResult} from '../types.js';
import INTERNAL_confirmEmailAddress from '../users/confirmEmailAddress/internalConfirmEmailAddress.js';
import signup from '../users/signup/handler.js';
import {SignupEndpointParams} from '../users/signup/types.js';
import signupWithOAuth from '../users/signupWithOAuth/handler.js';
import {SignupWithOAuthEndpointParams} from '../users/signupWithOAuth/types.js';
import {assertUser} from '../users/utils.js';
import addWorkspace from '../workspaces/addWorkspace/handler.js';
import {AddWorkspaceEndpointParams} from '../workspaces/addWorkspace/types.js';
import {makeRootnameFromName} from '../workspaces/utils.js';
import MockTestEmailProviderContext from './context/email/MockTestEmailProviderContext.js';
import {
  generateTestFileName,
  generateTestFilepathString,
} from './generate/file.js';
import {
  generateTestFileBinary,
  GenerateTestFileType,
  kGenerateTestFileType,
} from './generate/file/generateTestFileBinary.js';
import {IGenerateImageProps} from './generate/file/generateTestImage.js';
import {
  generateFileBackendConfigInput,
  generateFileBackendMountInput,
  generateFileBackendTypeForInput,
} from './generate/fileBackend.js';
import {generateTestFolderName} from './generate/folder.js';

export function getTestEmailProvider() {
  return new MockTestEmailProviderContext();
}

export async function initTests(overrides: FimidaraSuppliedConfig = {}) {
  await globalSetup(
    {
      useFimidaraApp: false,
      useFimidaraWorkerPool: false,
      ...overrides,
    },
    {
      useHandleFolderQueue: true,
      useHandleUsageRecordQueue: true,
      useHandleAddInternalMultipartIdQueue: true,
      useHandlePrepareFileQueue: true,
    }
  );

  await initFimidara();
}

export async function initFnTests() {
  await globalSetup(
    {useFimidaraApp: false, useFimidaraWorkerPool: false},
    {
      useHandleFolderQueue: true,
      useHandleUsageRecordQueue: true,
      useHandleAddInternalMultipartIdQueue: true,
      useHandlePrepareFileQueue: true,
    }
  );
}

export function assertEndpointResultOk(result?: BaseEndpointResult | void) {
  if (result?.errors?.length) {
    throw result.errors;
  }

  return true;
}

export function mockExpressRequest(token?: BaseTokenData) {
  const req: IServerRequest = {auth: token} as unknown as IServerRequest;
  return req;
}

export function mockExpressRequestWithAgentToken(
  token: Pick<
    PublicAgentToken,
    'resourceId' | 'createdAt' | 'expiresAt' | 'refreshToken'
  >
) {
  const req: IServerRequest = {
    auth:
      token.resourceId === kSystemSessionAgent.agentTokenId ||
      token.resourceId === kPublicSessionAgent.agentTokenId
        ? undefined
        : {
            version: kCurrentJWTTokenVersion,
            sub: {
              id: token.resourceId,
            },
            iat: token.createdAt,
            exp: token.expiresAt,
          },
  } as unknown as IServerRequest;

  return req;
}

export async function mockExpressRequestWithAgentRefreshToken(
  token: Pick<
    PublicAgentToken,
    'resourceId' | 'createdAt' | 'expiresAt' | 'refreshToken'
  >
) {
  const req: IServerRequest = {
    auth:
      token.resourceId === kSystemSessionAgent.agentTokenId ||
      token.resourceId === kPublicSessionAgent.agentTokenId
        ? undefined
        : {
            version: kCurrentJWTTokenVersion,
            sub: {
              id: token.resourceId,
              refreshToken: token.refreshToken
                ? await argon2.hash(token.refreshToken)
                : undefined,
            },
            iat: token.createdAt,
            exp: token.expiresAt,
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
  clientToken: AgentToken;
  user: PublicUser;
  token: string;
  clientAssignedToken: string;
  refreshToken: string;
  sessionAgent: SessionAgent;
}

export async function insertUserForTest(
  userInput: Partial<SignupEndpointParams> = {},
  /** Tests that mutate data will fail otherwise */
  skipAutoVerifyEmail = false
): Promise<IInsertUserForTestResult> {
  const reqData = RequestData.fromExpressRequest<SignupEndpointParams>(
    mockExpressRequest(),
    {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      ...userInput,
    }
  );

  const result = await signup(reqData);
  assertEndpointResultOk(result);
  let rawUser: UserWithWorkspace;

  if (!skipAutoVerifyEmail) {
    const user = await INTERNAL_confirmEmailAddress(
      result.user.resourceId,
      null
    );
    rawUser = await populateUserWorkspaces(user);
  } else {
    const user = await kIjxSemantic.user().getOneById(result.user.resourceId);
    assertUser(user);
    rawUser = await populateUserWorkspaces(user);
  }

  const userTokenData = kIjxUtils.session().decodeToken(result.jwtToken);
  const clientTokenData = kIjxUtils
    .session()
    .decodeToken(result.clientJwtToken);
  const [userToken, clientToken] = await Promise.all([
    kIjxSemantic.agentToken().getOneById(userTokenData.sub.id),
    kIjxSemantic.agentToken().getOneById(clientTokenData.sub.id),
  ]);
  assertAgentToken(userToken);
  assertAgentToken(clientToken);

  const sessionAgent = makeUserSessionAgent(rawUser, userToken);
  return {
    rawUser,
    userToken,
    clientToken,
    sessionAgent,
    user: {...result.user, isEmailVerified: rawUser.isEmailVerified},
    token: result.jwtToken,
    clientAssignedToken: result.clientJwtToken,
    refreshToken: result.refreshToken,
  };
}

export async function insertUserWithOAuthForTest(
  params: {
    userInput?: Partial<SignupWithOAuthEndpointParams>;
  } = {}
): Promise<IInsertUserForTestResult & {oauthUserId: string}> {
  const {userInput} = params;
  const reqData = RequestData.fromExpressRequest<SignupWithOAuthEndpointParams>(
    mockExpressRequest(),
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      emailVerifiedAt: getTimestamp(),
      oauthUserId: faker.string.uuid(),
      ...userInput,
    }
  );

  const result = await signupWithOAuth(reqData);
  assertEndpointResultOk(result);
  let rawUser: UserWithWorkspace;

  const user = await kIjxSemantic.user().getOneById(result.user.resourceId);
  assertUser(user);
  rawUser = await populateUserWorkspaces(user);

  const userTokenData = kIjxUtils.session().decodeToken(result.jwtToken);
  const clientTokenData = kIjxUtils
    .session()
    .decodeToken(result.clientJwtToken);
  const [userToken, clientToken] = await Promise.all([
    kIjxSemantic.agentToken().getOneById(userTokenData.sub.id),
    kIjxSemantic.agentToken().getOneById(clientTokenData.sub.id),
  ]);
  assertAgentToken(userToken);
  assertAgentToken(clientToken);

  const sessionAgent = makeUserSessionAgent(rawUser, userToken);
  const oauthUserId = user.oauthUserId;
  assert(oauthUserId);

  return {
    oauthUserId,
    rawUser,
    userToken,
    clientToken,
    sessionAgent,
    user: {...result.user, isEmailVerified: rawUser.isEmailVerified},
    token: result.jwtToken,
    clientAssignedToken: result.clientJwtToken,
    refreshToken: result.refreshToken,
  };
}

export interface IInsertWorkspaceForTestResult {
  workspace: PublicWorkspace;
  rawWorkspace: Workspace;
}

export async function insertWorkspaceForTest(
  userToken: AgentToken,
  workspaceInput: Partial<AddWorkspaceEndpointParams> = {}
): Promise<IInsertWorkspaceForTestResult> {
  const companyName = faker.lorem.words(6);
  const reqData = RequestData.fromExpressRequest<AddWorkspaceEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      name: companyName,
      rootname: makeRootnameFromName(companyName),
      description: faker.company.catchPhraseDescriptor(),
      // usageThresholds: generateTestUsageThresholdInputMap(),
      ...workspaceInput,
    }
  );

  const result = await addWorkspace(reqData);
  assertEndpointResultOk(result);

  const rawWorkspace = await kIjxSemantic
    .workspace()
    .getOneById(result.workspace.resourceId);
  assert(rawWorkspace);
  return {rawWorkspace, workspace: result.workspace};
}

export async function insertPermissionGroupForTest(
  userToken: AgentToken,
  workspaceId: string,
  permissionGroupInput: Partial<NewPermissionGroupInput> = {}
) {
  const reqData =
    RequestData.fromExpressRequest<AddPermissionGroupEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        workspaceId,
        name: faker.lorem.words(3),
        description: faker.lorem.words(10),
        ...permissionGroupInput,
      }
    );

  const result = await addPermissionGroup(reqData);
  assertEndpointResultOk(result);
  return result;
}

export async function insertPermissionItemsForTest(
  userToken: AgentToken,
  workspaceId: string,
  input: PermissionItemInput | PermissionItemInput[]
) {
  const reqData =
    RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {workspaceId, items: convertToArray(input)}
    );
  const result = await addPermissionItems(reqData);
  assertEndpointResultOk(result);
  return result;
}

export async function insertRequestForTest(
  userToken: AgentToken,
  workspaceId: string,
  requestInput: Partial<CollaborationRequestInput> = {}
) {
  const reqData =
    RequestData.fromExpressRequest<SendCollaborationRequestEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        workspaceId,
        recipientEmail: faker.internet.email(),
        message: faker.lorem.paragraph(),
        expires: getTimestamp(add(Date.now(), {days: 10})),
        ...requestInput,
      }
    );

  const result = await sendRequest(reqData);
  assertEndpointResultOk(result);
  return result;
}

export async function insertAgentTokenForTest(
  userToken: AgentToken,
  workspaceId: string,
  tokenInput: Partial<AddAgentTokenEndpointParams> = {}
) {
  const reqData = RequestData.fromExpressRequest<AddAgentTokenEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      workspaceId,
      expiresAt: getTimestamp(add(Date.now(), {days: 1})),
      name: faker.lorem.words(7),
      description: faker.lorem.words(10),
      ...tokenInput,
    }
  );

  const result = await addAgentTokenEndpoint(reqData);
  assertEndpointResultOk(result);

  const rawToken = await kIjxSemantic
    .agentToken()
    .getOneById(result.token.resourceId);
  assert(rawToken);

  return {...result, rawToken};
}

export async function insertFileBackendConfigForTest(
  userToken: AgentToken,
  workspaceId: string,
  input: Partial<NewFileBackendConfigInput> = {}
) {
  const reqData =
    RequestData.fromExpressRequest<AddFileBackendConfigEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        workspaceId,
        ...generateFileBackendConfigInput(input),
      }
    );

  const result = await addFileBackendConfig(reqData);
  assertEndpointResultOk(result);

  const rawConfig = await kIjxSemantic
    .fileBackendConfig()
    .getOneById(result.config.resourceId);
  assert(rawConfig);

  return {...result, rawConfig};
}

export async function insertFileBackendMountForTest(
  userToken: AgentToken,
  workspace: Pick<Workspace, 'resourceId' | 'rootname'>,
  input: Partial<NewFileBackendMountInput> = {},
  insertConfig = true
) {
  const {rootname, resourceId: workspaceId} = workspace;
  const backend = generateFileBackendTypeForInput() || input.backend;
  const addConfigResult = insertConfig
    ? await insertFileBackendConfigForTest(userToken, workspaceId, {backend})
    : null;
  const mountInput = generateFileBackendMountInput({
    backend,
    configId: addConfigResult?.config.resourceId,
    folderpath: generateTestFilepathString({rootname}),
    ...input,
  });
  const reqData =
    RequestData.fromExpressRequest<AddFileBackendMountEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {workspaceId, ...mountInput}
    );

  const result = await addFileBackendMountEndpoint(reqData);
  assertEndpointResultOk(result);

  const rawMount = await kIjxSemantic
    .fileBackendMount()
    .getOneById(result.mount.resourceId);
  appAssert(rawMount);

  return mergeData(
    result,
    mergeData(addConfigResult, {rawMount}, {arrayUpdateStrategy: 'replace'}),
    {arrayUpdateStrategy: 'replace'}
  );
}

export async function insertFolderForTest(
  userToken: AgentToken | null,
  workspace: PublicWorkspace,
  folderInput: Partial<NewFolderInput> = {}
) {
  const reqData = RequestData.fromExpressRequest<AddFolderEndpointParams>(
    userToken
      ? mockExpressRequestWithAgentToken(userToken)
      : mockExpressRequestForPublicAgent(),
    {
      folderpath: addRootnameToPath(
        pathJoin([generateTestFolderName({includeStraySeparators: true})]),
        workspace.rootname
      ),
      description: faker.lorem.paragraph(),
      ...folderInput,
    }
  );

  const result = await addFolder(reqData);
  assertEndpointResultOk(result);

  const rawFolder = await kIjxSemantic
    .folder()
    .getOneById(result.folder.resourceId);
  appAssert(rawFolder);

  return {...result, rawFolder};
}

export async function insertFileForTest(
  userToken: AgentToken | null, // Pass null for public agent
  workspace: Pick<Workspace, 'rootname'>,
  fileInput: Partial<UploadFileEndpointParams> = {},
  type: GenerateTestFileType = kGenerateTestFileType.png,
  imageProps?: IGenerateImageProps
) {
  const testBuffer = Buffer.from('Hello world!');
  const testStream = Readable.from([testBuffer]);
  const input: UploadFileEndpointParams = {
    filepath: addRootnameToPath(
      pathJoin([generateTestFileName()]),
      workspace.rootname
    ),
    description: faker.lorem.paragraph(),
    mimetype: 'application/octet-stream',
    // Not used, because it's replaced either by `fileInput` or below when we
    // generate a test file. It's added here to satisfy the type checker.
    size: testBuffer.byteLength,
    data: testStream,
  };

  let dataBuffer: Buffer | undefined = undefined;

  if (fileInput.data) {
    assert(
      isNumber(fileInput.size),
      'size param must be provided if data param is set'
    );
  }

  if (!fileInput.data) {
    const generated = await generateTestFileBinary({type, imageProps});
    dataBuffer = generated.dataBuffer;
    mergeData(input, generated.getInput(), {arrayUpdateStrategy: 'replace'});
  }

  mergeData(input, fileInput, {arrayUpdateStrategy: 'replace'});
  const reqData = RequestData.fromExpressRequest<UploadFileEndpointParams>(
    userToken
      ? mockExpressRequestWithAgentToken(userToken)
      : mockExpressRequestForPublicAgent(),
    input
  );

  const result = await uploadFile(reqData);
  assertEndpointResultOk(result);

  const rawFile = await kIjxSemantic
    .file()
    .assertGetOneByQuery(
      EndpointReusableQueries.getByResourceId(result.file.resourceId)
    );

  return {...result, dataBuffer, rawFile, reqData: reqData};
}
