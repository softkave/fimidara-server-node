import {faker} from '@faker-js/faker';
import {add} from 'date-fns';
import {merge} from 'lodash';
import {Readable} from 'stream';
import {AgentToken} from '../../definitions/agentToken';
import {
  BaseTokenData,
  kCurrentJWTTokenVersion,
  SessionAgent,
} from '../../definitions/system';
import {PublicUser, UserWithWorkspace} from '../../definitions/user';
import {PublicWorkspace, Workspace} from '../../definitions/workspace';
import {appAssert} from '../../utils/assertion';
import {getTimestamp} from '../../utils/dateFns';
import {toArray} from '../../utils/fns';
import {makeUserSessionAgent} from '../../utils/sessionUtils';
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
import {globalSetup} from '../contexts/globalUtils';
import {kSemanticModels, kUtilsInjectables} from '../contexts/injection/injectables';
import {IServerRequest} from '../contexts/types';
import addFileBackendConfig from '../fileBackends/addConfig/handler';
import {
  AddFileBackendConfigEndpointParams,
  NewFileBackendConfigInput,
} from '../fileBackends/addConfig/types';
import addFileBackendMountEndpoint from '../fileBackends/addMount/handler';
import {
  AddFileBackendMountEndpointParams,
  NewFileBackendMountInput,
} from '../fileBackends/addMount/types';
import uploadFile from '../files/uploadFile/handler';
import {UploadFileEndpointParams} from '../files/uploadFile/types';
import addFolder from '../folders/addFolder/handler';
import {AddFolderEndpointParams, NewFolderInput} from '../folders/addFolder/types';
import {kFolderConstants} from '../folders/constants';
import {addRootnameToPath} from '../folders/utils';
import addPermissionGroup from '../permissionGroups/addPermissionGroup/handler';
import {
  AddPermissionGroupEndpointParams,
  NewPermissionGroupInput,
} from '../permissionGroups/addPermissionGroup/types';
import addPermissionItems from '../permissionItems/addItems/handler';
import {AddPermissionItemsEndpointParams} from '../permissionItems/addItems/types';
import {PermissionItemInput} from '../permissionItems/types';
import EndpointReusableQueries from '../queries';
import RequestData from '../RequestData';
import {setupApp} from '../runtime/initAppSetup';
import {BaseEndpointResult} from '../types';
import INTERNAL_confirmEmailAddress from '../users/confirmEmailAddress/internalConfirmEmailAddress';
import signup from '../users/signup/signup';
import {SignupEndpointParams} from '../users/signup/types';
import {assertUser} from '../users/utils';
import addWorkspace from '../workspaces/addWorkspace/handler';
import {AddWorkspaceEndpointParams} from '../workspaces/addWorkspace/types';
import {makeRootnameFromName} from '../workspaces/utils';
import MockTestEmailProviderContext from './context/email/MockTestEmailProviderContext';
import {generateTestFileName, generateTestFilepathString} from './generate/file';
import {
  generateFileBackendConfigInput,
  generateFileBackendMountInput,
  generateFileBackendTypeForInput,
} from './generate/fileBackend';
import {generateTestFolderName} from './generate/folder';
import sharp = require('sharp');
import assert = require('assert');

export function getTestEmailProvider() {
  return new MockTestEmailProviderContext();
}

export async function initTests() {
  await globalSetup();
  await setupApp();
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
    auth: {
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
  user: PublicUser;
  userTokenStr: string;
  reqData: RequestData<SignupEndpointParams>;
  sessionAgent: SessionAgent;
}

export async function insertUserForTest(
  userInput: Partial<SignupEndpointParams> = {},
  /** Tests that mutate data will fail otherwise */
  skipAutoVerifyEmail = false
): Promise<IInsertUserForTestResult> {
  const instData = RequestData.fromExpressRequest<SignupEndpointParams>(
    mockExpressRequest(),
    {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      ...userInput,
    }
  );

  const result = await signup(instData);
  assertEndpointResultOk(result);
  let rawUser: UserWithWorkspace;

  if (!skipAutoVerifyEmail) {
    const user = await INTERNAL_confirmEmailAddress(result.user.resourceId, null);
    rawUser = await populateUserWorkspaces(user);
  } else {
    const user = await kSemanticModels.user().getOneById(result.user.resourceId);
    assertUser(user);
    rawUser = await populateUserWorkspaces(user);
  }

  const tokenData = kUtilsInjectables.session().decodeToken(result.token);
  const userToken = await kSemanticModels.agentToken().getOneById(tokenData.sub.id);
  assertAgentToken(userToken);

  const sessionAgent = makeUserSessionAgent(rawUser, userToken);

  return {
    rawUser,
    userToken,
    sessionAgent,
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

  const result = await addWorkspace(instData);
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

  const result = await addPermissionGroup(instData);
  assertEndpointResultOk(result);
  return result;
}

export async function insertPermissionItemsForTest(
  userToken: AgentToken,
  workspaceId: string,
  input: PermissionItemInput | PermissionItemInput[]
) {
  const instData = RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {workspaceId, items: toArray(input)}
  );
  const result = await addPermissionItems(instData);
  assertEndpointResultOk(result);
  return result;
}

export async function insertRequestForTest(
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

  const result = await sendRequest(instData);
  assertEndpointResultOk(result);
  return result;
}

export async function insertAgentTokenForTest(
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

  const result = await addAgentTokenEndpoint(instData);
  assertEndpointResultOk(result);
  return result;
}

export async function insertFileBackendConfigForTest(
  userToken: AgentToken,
  workspaceId: string,
  input: Partial<NewFileBackendConfigInput> = {}
) {
  const instData = RequestData.fromExpressRequest<AddFileBackendConfigEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      workspaceId,
      config: generateFileBackendConfigInput(input),
    }
  );

  const result = await addFileBackendConfig(instData);
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
  const instData = RequestData.fromExpressRequest<AddFileBackendMountEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {workspaceId, mount: mountInput}
  );

  const result = await addFileBackendMountEndpoint(instData);
  assertEndpointResultOk(result);

  const rawMount = await kSemanticModels
    .fileBackendMount()
    .getOneById(result.mount.resourceId);
  appAssert(rawMount);

  return merge(result, addConfigResult, {rawMount});
}

export async function insertFolderForTest(
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
          [generateTestFolderName({includeStraySeparators: true})].join(
            kFolderConstants.separator
          ),
          workspace.rootname
        ),
        description: faker.lorem.paragraph(),
        ...folderInput,
      },
    }
  );

  const result = await addFolder(instData);
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
      [generateTestFileName()].join(kFolderConstants.separator),
      workspace.rootname
    ),
    description: faker.lorem.paragraph(),
    data: testStream,
    mimetype: 'application/octet-stream',
  };

  assert(input.filepath);
  let dataBuffer: Buffer | undefined = undefined;

  if (!fileInput.data) {
    if (type === 'png') {
      const {imgBuffer, imgStream} = await generateTestImage(imageProps);
      input.data = imgStream;
      input.mimetype = 'image/png';
      dataBuffer = imgBuffer;
    } else {
      const {textBuffer, textStream} = generateTestTextFile();
      input.data = textStream;
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
  const result = await uploadFile(instData);
  assertEndpointResultOk(result);

  const rawFile = await kSemanticModels
    .file()
    .assertGetOneByQuery(EndpointReusableQueries.getByResourceId(result.file.resourceId));

  assert(dataBuffer);
  return {...result, dataBuffer, rawFile, reqData: instData};
}
