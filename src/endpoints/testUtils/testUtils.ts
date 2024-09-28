import {faker} from '@faker-js/faker';
import assert from 'assert';
import {add} from 'date-fns';
import {Readable} from 'stream';
import {globalSetup} from '../../contexts/globalUtils.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
import {IServerRequest} from '../../contexts/types.js';
import {AgentToken} from '../../definitions/agentToken.js';
import {
  BaseTokenData,
  kCurrentJWTTokenVersion,
  SessionAgent,
} from '../../definitions/system.js';
import {PublicUser, UserWithWorkspace} from '../../definitions/user.js';
import {PublicWorkspace, Workspace} from '../../definitions/workspace.js';
import {kPublicSessionAgent, kSystemSessionAgent} from '../../utils/agent.js';
import {appAssert} from '../../utils/assertion.js';
import {getTimestamp} from '../../utils/dateFns.js';
import {convertToArray, mergeData, pathJoin} from '../../utils/fns.js';
import {makeUserSessionAgent} from '../../utils/sessionUtils.js';
import addAgentTokenEndpoint from '../agentTokens/addToken/handler.js';
import {
  AddAgentTokenEndpointParams,
  NewAgentTokenInput,
} from '../agentTokens/addToken/types.js';
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
import signup from '../users/signup/signup.js';
import {SignupEndpointParams} from '../users/signup/types.js';
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
  generateFileBackendConfigInput,
  generateFileBackendMountInput,
  generateFileBackendTypeForInput,
} from './generate/fileBackend.js';
import {generateTestFolderName} from './generate/folder.js';
import sharp = require('sharp');

export function getTestEmailProvider() {
  return new MockTestEmailProviderContext();
}

export async function initTests() {
  await globalSetup({useFimidaraApp: false, useFimidaraWorkerPool: false});
  await initFimidara();
}

export async function initFnTests() {
  await globalSetup({useFimidaraApp: false, useFimidaraWorkerPool: false});
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
  token: Pick<AgentToken, 'resourceId' | 'createdAt' | 'expiresAt'>
) {
  const req: IServerRequest = {
    auth:
      token.resourceId === kSystemSessionAgent.agentTokenId ||
      token.resourceId === kPublicSessionAgent.agentTokenId
        ? undefined
        : {
            version: kCurrentJWTTokenVersion,
            sub: {id: token.resourceId},
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
  userTokenStr: string;
  clientTokenStr: string;
  reqData: RequestData<SignupEndpointParams>;
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
    const user = await kSemanticModels
      .user()
      .getOneById(result.user.resourceId);
    assertUser(user);
    rawUser = await populateUserWorkspaces(user);
  }

  const userTokenData = kUtilsInjectables.session().decodeToken(result.token);
  const clientTokenData = kUtilsInjectables
    .session()
    .decodeToken(result.clientAssignedToken);
  const [userToken, clientToken] = await Promise.all([
    kSemanticModels.agentToken().getOneById(userTokenData.sub.id),
    kSemanticModels.agentToken().getOneById(clientTokenData.sub.id),
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
    userTokenStr: result.token,
    clientTokenStr: result.clientAssignedToken,
    reqData: reqData,
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
  const rawWorkspace = await kSemanticModels
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
  tokenInput: Partial<NewAgentTokenInput> = {}
) {
  const reqData = RequestData.fromExpressRequest<AddAgentTokenEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      workspaceId,
      expires: getTimestamp(add(Date.now(), {days: 1})),
      name: faker.lorem.words(7),
      description: faker.lorem.words(10),
      ...tokenInput,
    }
  );

  const result = await addAgentTokenEndpoint(reqData);
  assertEndpointResultOk(result);

  const rawToken = await kSemanticModels
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

  const rawConfig = await kSemanticModels
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

  const rawMount = await kSemanticModels
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

  const rawFolder = await kSemanticModels
    .folder()
    .getOneById(result.folder.resourceId);
  appAssert(rawFolder);

  return {...result, rawFolder};
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
      pathJoin([generateTestFileName()]),
      workspace.rootname
    ),
    description: faker.lorem.paragraph(),
    mimetype: 'application/octet-stream',
    // Not used, because they're replaced either by fileInput or below
    size: testBuffer.byteLength,
    data: testStream,
  };

  assert(input.filepath);
  let dataBuffer: Buffer | undefined = undefined;

  if (fileInput.data) {
    assert(fileInput.size, 'size must be provided is data is set');
  }

  if (!fileInput.data) {
    if (type === 'png') {
      const {imgBuffer, imgStream} = await generateTestImage(imageProps);
      input.data = imgStream;
      input.mimetype = 'image/png';
      input.size = imgBuffer.byteLength;
      dataBuffer = imgBuffer;
    } else {
      const {textBuffer, textStream} = generateTestTextFile();
      input.data = textStream;
      input.mimetype = 'text/plain';
      input.encoding = 'utf-8';
      input.size = textBuffer.byteLength;
      dataBuffer = textBuffer;
    }
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

  const rawFile = await kSemanticModels
    .file()
    .assertGetOneByQuery(
      EndpointReusableQueries.getByResourceId(result.file.resourceId)
    );

  assert(dataBuffer);
  return {...result, dataBuffer, rawFile, reqData: reqData};
}
