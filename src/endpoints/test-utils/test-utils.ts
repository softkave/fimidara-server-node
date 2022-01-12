import {add, differenceInSeconds} from 'date-fns';
import * as faker from 'faker';
import sharp = require('sharp');
import {
  AppResourceType,
  BasicCRUDActions,
  crudActionsList,
} from '../../definitions/system';
import {IUserToken} from '../../definitions/userToken';
import {getAppVariables, setAppVariables} from '../../resources/appVariables';
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
import {TestEmailProviderContext} from '../contexts/EmailProviderContext';
import {TestFilePersistenceProviderContext} from '../contexts/FilePersistenceProviderContext';
import MemoryDataProviderContext from '../contexts/MemoryDataProviderContext';
import {
  CURRENT_TOKEN_VERSION,
  IBaseTokenData,
  TokenType,
} from '../contexts/SessionContext';
import {IServerRequest} from '../contexts/types';
import uploadFile from '../files/uploadFile/handler';
import {INewFileInput, IUploadFileParams} from '../files/uploadFile/types';
import addFolder from '../folders/addFolder/handler';
import {IAddFolderParams, INewFolderInput} from '../folders/addFolder/types';
import {folderConstants} from '../folders/constants';
import addOrganization from '../organizations/addOrganization/handler';
import {IAddOrganizationParams} from '../organizations/addOrganization/types';
import addPermissionItems from '../permissionItems/addItems/handler';
import {
  IAddPermissionItemsParams,
  INewPermissionItemInput,
} from '../permissionItems/addItems/types';
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
import RequestData from '../RequestData';
import {IBaseEndpointResult} from '../types';
import signup from '../user/signup/signup';
import {ISignupParams} from '../user/signup/types';
import UserTokenQueries from '../user/UserTokenQueries';

export const getTestBaseContext = singletonFunc(() => {
  setAppVariables({
    clientDomain: 'localhost:3000',
    mongoDbURI:
      'mongodb+srv://softkave:LMOGkLHjho8L2ahx@softkave.ocsur.mongodb.net/files-unit-test?authSource=admin&replicaSet=atlas-hflb2m-shard-0&w=majority&readPreference=primary&retryWrites=true&ssl=true',
    jwtSecret: 'test-jwt-secret-5768394',
    nodeEnv: 'test',
    port: '5000',
    S3Bucket: 'files-unit-test',
  });

  const appVariables = getAppVariables();
  return new BaseContext(
    new MemoryDataProviderContext(),
    new TestEmailProviderContext(),
    new TestFilePersistenceProviderContext(),
    appVariables
  );
});

export function assertEndpointResultOk(result: IBaseEndpointResult) {
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
        id: token.resourceId,
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
  assertEndpointResultOk(result);

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
        expires: differenceInSeconds(add(Date.now(), {days: 1}), Date.now()),
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
  const instData = RequestData.fromExpressRequest<IAddClientAssignedTokenParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId,
      token: {
        presets: [],
        expires: differenceInSeconds(add(Date.now(), {days: 1}), Date.now()),
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
        name: faker.lorem.sentence(20),
        description: faker.lorem.sentence(50),
        presets: [],
        ...tokenInput,
      },
    }
  );

  const result = await addProgramAccessToken(context, instData);
  assertEndpointResultOk(result);
  return result;
}

function makePermissionItemInputs(
  owner: {permissionOwnerId: string; permissionOwnerType: AppResourceType},
  base: Partial<INewPermissionItemInput> & {itemResourceType: AppResourceType}
) {
  const items: INewPermissionItemInput[] = crudActionsList.map(action => ({
    ...base,
    ...owner,
    action: action as BasicCRUDActions,
    isExclusion: faker.datatype.boolean(),
    isForPermissionOwnerOnly: faker.datatype.boolean(),
  }));

  return items;
}

export async function insertPermissionItemsForTest01(
  context: IBaseContext,
  userToken: IUserToken,
  organizationId: string,
  entity: IPermissionEntity,
  owner: {permissionOwnerId: string; permissionOwnerType: AppResourceType},
  base: Partial<INewPermissionItemInput> & {itemResourceType: AppResourceType}
) {
  const itemsInput = makePermissionItemInputs(owner, base);
  const instData = RequestData.fromExpressRequest<IAddPermissionItemsParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      ...entity,
      organizationId: organizationId,
      items: itemsInput,
    }
  );

  const result = await addPermissionItems(context, instData);
  assertEndpointResultOk(result);
  expect(result.items.length).toEqual(itemsInput.length);
  return result;
}

export async function insertPermissionItemsForTest02(
  context: IBaseContext,
  userToken: IUserToken,
  organizationId: string,
  entity: IPermissionEntity,
  items: INewPermissionItemInput[]
) {
  const instData = RequestData.fromExpressRequest<IAddPermissionItemsParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      ...entity,
      items,
      organizationId: organizationId,
    }
  );

  const result = await addPermissionItems(context, instData);
  assertEndpointResultOk(result);
  expect(result.items.length).toEqual(items.length);
  return result;
}

export async function insertFolderForTest(
  context: IBaseContext,
  userToken: IUserToken,
  organizationId: string,
  folderInput: Partial<INewFolderInput> = {}
) {
  const instData = RequestData.fromExpressRequest<IAddFolderParams>(
    mockExpressRequestWithUserToken(userToken),
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
  userToken: IUserToken,
  organizationId: string,
  fileInput: Partial<INewFileInput> = {},
  type: 'image' | 'text' = 'image',
  imageProps?: IGenerateImageProps
) {
  const input: INewFileInput = {
    path: [faker.lorem.word()].join(folderConstants.nameSeparator),
    description: faker.lorem.paragraph(),
    data: Buffer.from(faker.lorem.word()),
    mimetype: 'application/octet-stream',
    ...fileInput,
  };

  if (!input.data) {
    if (type === 'image') {
      input.data = await generateTestImage(imageProps);
      input.mimetype = 'image/png';
    } else {
      input.data = generateTestTextFile();
      input.mimetype = 'text/plain';
      input.encoding = 'utf-8';
    }
  }

  const instData = RequestData.fromExpressRequest<IUploadFileParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId,
      file: input,
    }
  );

  const result = await uploadFile(context, instData);
  assertEndpointResultOk(result);
  return {...result, buffer: input.data};
}
