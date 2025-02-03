import {customAlphabet} from 'nanoid';
import {AnyObject} from 'softkave-js-utils';
import {
  FimidaraPermissionAction,
  kFimidaraPermissionActions,
} from '../definitions/permissionItem.js';
import {
  PublicAgent,
  PublicResource,
  PublicWorkspaceResource,
  kFimidaraPublicResourceType,
  kValidAgentTypes,
} from '../definitions/system.js';
import {
  UsageRecordCategory,
  UsageRecordFulfillmentStatus,
  kUsageRecordCategory,
  kUsageRecordFulfillmentStatus,
} from '../definitions/usageRecord.js';
import {FieldObjectFieldsMap, mddocConstruct} from '../mddoc/mddoc.js';
import {FimidaraExternalError} from '../utils/OperationError.js';
import {kIdSeparator, kResourceTypeShortNames} from '../utils/resource.js';
import {kEndpointConstants} from './constants.js';
import {
  LongRunningJobResult,
  MultipleLongRunningJobResult,
} from './jobs/types.js';
import {
  BaseEndpointResult,
  CountItemsEndpointResult,
  EndpointResultNote,
  HttpEndpointRequestHeaders_AuthOptional,
  HttpEndpointRequestHeaders_AuthOptional_ContentType,
  HttpEndpointRequestHeaders_AuthRequired,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointRequestHeaders_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
  ServerRecommendedActionsMap,
  kEndpointResultNoteCodeMap,
} from './types.js';

export const mddocEndpointStatusCodes = {
  success: `${kEndpointConstants.httpStatusCode.ok}`,
  error: '4XX or 5XX',
} as const;

const requestHeaderItem_JsonContentType = mddocConstruct
  .constructFieldString()
  .setDescription('HTTP JSON request content type')
  .setExample('application/json');
const requestHeaderItem_MultipartFormdataContentType = mddocConstruct
  .constructFieldString()
  .setDescription('HTTP multipart form-data request content type')
  .setExample('multipart/form-data')
  .setValid(['multipart/form-data']);
const responseHeaderItem_JsonContentType = mddocConstruct
  .constructFieldString()
  .setDescription('HTTP JSON response content type')
  .setExample('application/json');
const responseHeaderItem_ContentLength = mddocConstruct
  .constructFieldString()
  .setDescription('HTTP response content length in bytes');
const responseHeaderItem_ContentDisposition = mddocConstruct
  .constructFieldString()
  .setDescription('HTTP response content disposition');
const requestHeaderItem_Authorization = mddocConstruct
  .constructFieldString()
  .setDescription('Access token')
  .setExample('Bearer <token>');
const requestHeaderItem_ContentType = mddocConstruct
  .constructFieldString()
  .setDescription('HTTP request content type')
  .setExample('application/json or multipart/form-data');
const requestHeaderItem_InterServerAuthSecret = mddocConstruct
  .constructFieldString()
  .setDescription('Inter server auth secret')
  .setExample(customAlphabet('0')());

const requestHeaders_AuthRequired_JsonContentType = mddocConstruct
  .constructFieldObject<HttpEndpointRequestHeaders_AuthRequired_ContentType>()
  .setFields({
    Authorization: mddocConstruct.constructFieldObjectField(
      true,
      requestHeaderItem_Authorization
    ),
    'Content-Type': mddocConstruct.constructFieldObjectField(
      true,
      requestHeaderItem_JsonContentType
    ),
  })
  .setName('HttpEndpointRequestHeaders_AuthRequired_JsonContentType');
const requestHeaders_AuthOptional_JsonContentType = mddocConstruct
  .constructFieldObject<HttpEndpointRequestHeaders_AuthOptional_ContentType>()
  .setFields({
    Authorization: mddocConstruct.constructFieldObjectField(
      false,
      requestHeaderItem_Authorization
    ),
    'Content-Type': mddocConstruct.constructFieldObjectField(
      true,
      requestHeaderItem_JsonContentType
    ),
  })
  .setName('HttpEndpointRequestHeaders_AuthOptional_JsonContentType');
const requestHeaders_JsonContentType = mddocConstruct
  .constructFieldObject<HttpEndpointRequestHeaders_ContentType>()
  .setFields({
    'Content-Type': mddocConstruct.constructFieldObjectField(
      true,
      requestHeaderItem_JsonContentType
    ),
  })
  .setName('HttpEndpointRequestHeaders_JsonContentType');
const requestHeaders_AuthRequired_MultipartContentType = mddocConstruct
  .constructFieldObject<HttpEndpointRequestHeaders_AuthRequired_ContentType>()
  .setFields({
    Authorization: mddocConstruct.constructFieldObjectField(
      true,
      requestHeaderItem_Authorization
    ),
    'Content-Type': mddocConstruct.constructFieldObjectField(
      true,
      requestHeaderItem_MultipartFormdataContentType
    ),
  })
  .setName('HttpEndpointRequestHeaders_AuthRequired_MultipartContentType');
const requestHeaders_AuthOptional_MultipartContentType = mddocConstruct
  .constructFieldObject<HttpEndpointRequestHeaders_AuthOptional_ContentType>()
  .setFields({
    Authorization: mddocConstruct.constructFieldObjectField(
      false,
      requestHeaderItem_Authorization
    ),
    'Content-Type': mddocConstruct.constructFieldObjectField(
      true,
      requestHeaderItem_MultipartFormdataContentType
    ),
  })
  .setName('HttpEndpointRequestHeaders_AuthOptional_MultipartContentType');
const requestHeaders_MultipartContentType = mddocConstruct
  .constructFieldObject<HttpEndpointRequestHeaders_ContentType>()
  .setFields({
    'Content-Type': mddocConstruct.constructFieldObjectField(
      true,
      requestHeaderItem_MultipartFormdataContentType
    ),
  })
  .setName('HttpEndpointRequestHeaders_MultipartContentType');
const requestHeaders_AuthRequired = mddocConstruct
  .constructFieldObject<HttpEndpointRequestHeaders_AuthRequired>()
  .setFields({
    Authorization: mddocConstruct.constructFieldObjectField(
      true,
      requestHeaderItem_Authorization
    ),
  })
  .setName('HttpEndpointRequestHeaders_AuthRequired');
const requestHeaders_AuthOptional = mddocConstruct
  .constructFieldObject<HttpEndpointRequestHeaders_AuthOptional>()
  .setFields({
    Authorization: mddocConstruct.constructFieldObjectField(
      false,
      requestHeaderItem_Authorization
    ),
  })
  .setName('HttpEndpointRequestHeaders_AuthOptional');
const responseHeaders_JsonContentType = mddocConstruct
  .constructFieldObject<HttpEndpointResponseHeaders_ContentType_ContentLength>()
  .setFields({
    'Content-Type': mddocConstruct.constructFieldObjectField(
      true,
      responseHeaderItem_JsonContentType
    ),
    'Content-Length': mddocConstruct.constructFieldObjectField(
      true,
      responseHeaderItem_ContentLength
    ),
  })
  .setName('HttpEndpointResponseHeaders_ContentType_ContentLength');

export const mddocEndpointHttpHeaderItems = {
  requestHeaderItem_Authorization,
  requestHeaderItem_ContentType,
  responseHeaderItem_JsonContentType,
  requestHeaderItem_JsonContentType,
  requestHeaderItem_MultipartFormdataContentType,
  requestHeaders_AuthRequired_JsonContentType,
  requestHeaders_AuthRequired,
  requestHeaders_JsonContentType,
  requestHeaders_AuthOptional,
  requestHeaders_MultipartContentType,
  requestHeaders_AuthOptional_MultipartContentType,
  requestHeaders_AuthRequired_MultipartContentType,
  requestHeaders_AuthOptional_JsonContentType,
  responseHeaderItem_ContentLength,
  responseHeaders_JsonContentType,
  responseHeaderItem_ContentDisposition,
  requestHeaderItem_InterServerAuthSecret,
};

const nullValue = mddocConstruct.constructFieldNull();
const agent = mddocConstruct
  .constructFieldObject<PublicAgent>()
  .setName('Agent')
  .setFields({
    agentId: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldString()
        .setDescription('Agent ID. Possible agents are users and agent tokens')
    ),
    agentType: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldString()
        .setDescription('Agent type')
        .setExample(kFimidaraPublicResourceType.AgentToken)
        .setValid(kValidAgentTypes)
        .setEnumName('AgentType')
    ),
  });
const date = mddocConstruct
  .constructFieldNumber()
  .setDescription('UTC timestamp in milliseconds');
const dateOrNull = mddocConstruct
  .constructFieldOrCombination<number | null>()
  .setTypes([date, nullValue]);
const id = mddocConstruct
  .constructFieldString()
  .setDescription('Resource ID')
  .setExample(
    `${
      kResourceTypeShortNames[kFimidaraPublicResourceType.Workspace]
    }${kIdSeparator}${customAlphabet('0')()}`
  );
const idList = mddocConstruct
  .constructFieldArray<string>()
  .setType(id)
  .setDescription('List of resource IDs');
const idOrList = mddocConstruct
  .constructFieldOrCombination<string | string[]>()
  .setTypes([id, idList]);
const jobId = mddocConstruct
  .constructFieldString()
  .setDescription('Long running job ID')
  .setExample(
    `${
      kResourceTypeShortNames[kFimidaraPublicResourceType.Job]
    }${kIdSeparator}${customAlphabet('0')()}`
  );
const jobIds = mddocConstruct
  .constructFieldArray<string>()
  .setDescription('Multiple long running job IDs')
  .setType(jobId);
const workspaceId = mddocConstruct
  .constructFieldString()
  .setDescription(
    'Workspace ID. When not provided, will default to using workspace ID from agent token'
  )
  .setExample(
    `${
      kResourceTypeShortNames[kFimidaraPublicResourceType.Workspace]
    }${kIdSeparator}${customAlphabet('0')()}`
  );
const workspaceIdInput = workspaceId
  .clone()
  .setDescription(
    'Workspace ID. When not provided, will default to using workspace ID from agent token'
  );

const folderId = mddocConstruct
  .constructFieldString()
  .setDescription('Folder ID')
  .setExample(
    `${
      kResourceTypeShortNames[kFimidaraPublicResourceType.Folder]
    }${kIdSeparator}${customAlphabet('0')()}`
  );
const folderIdOrNull = mddocConstruct
  .constructFieldOrCombination<string | null>()
  .setTypes([folderId, mddocConstruct.constructFieldNull()]);
const fileId = mddocConstruct
  .constructFieldString()
  .setDescription('File ID')
  .setExample(
    `${
      kResourceTypeShortNames[kFimidaraPublicResourceType.File]
    }${kIdSeparator}${customAlphabet('0')()}`
  );
const permissionGroupId = mddocConstruct
  .constructFieldString()
  .setDescription('Permission group ID')
  .setExample(
    `${
      kResourceTypeShortNames[kFimidaraPublicResourceType.PermissionGroup]
    }${kIdSeparator}${customAlphabet('0')()}`
  );
const permissionItemId = mddocConstruct
  .constructFieldString()
  .setDescription('Permission item ID')
  .setExample(
    `${
      kResourceTypeShortNames[kFimidaraPublicResourceType.PermissionItem]
    }${kIdSeparator}${customAlphabet('0')()}`
  );
const idPath = mddocConstruct
  .constructFieldArray<string>()
  .setType(folderId)
  .setDescription('List of parent folder IDs');
const name = mddocConstruct
  .constructFieldString()
  .setDescription('Name, case insensitive');
const description = mddocConstruct
  .constructFieldString()
  .setDescription('Description');
const expires = mddocConstruct
  .constructFieldNumber()
  .setDescription('Expiration date');
const jwtTokenExpiresAt = mddocConstruct
  .constructFieldNumber()
  .setDescription(
    'JWT token expiration date. Not the expiration date of the token itself.'
  );
const duration = mddocConstruct
  .constructFieldNumber()
  .setDescription(
    'Time duration in milliseconds, for example, 1000 for 1 second'
  );
const tokenString = mddocConstruct
  .constructFieldString()
  .setDescription('JWT token string');
const refreshTokenString = mddocConstruct
  .constructFieldString()
  .setDescription('JWT refresh token string');
const effectOnReferenced = mddocConstruct
  .constructFieldBoolean()
  .setDescription(
    'Whether to perform action on the token used to authorize the API call ' +
      'when performing actions on tokens and a token ID or provided resource ID is not provided' +
      'Defaults to true if a call is made and a token ID is not provided'
  );
const providedResourceId = mddocConstruct
  .constructFieldString()
  .setDescription('Resource ID provided by you')
  .setMax(kEndpointConstants.providedResourceIdMaxLength);
const providedResourceIdOrNull = mddocConstruct
  .constructFieldOrCombination<string | null>()
  .setTypes([providedResourceId, nullValue]);
const workspaceName = mddocConstruct
  .constructFieldString()
  .setDescription('Workspace name, case insensitive')
  .setExample('fimidara');

// TODO: set allowed characters for rootname and file and folder name
const workspaceRootname = mddocConstruct
  .constructFieldString()
  .setDescription(
    'Workspace root name, must be a URL compatible name, case insensitive'
  )
  .setExample('fimidara-rootname');
const firstName = mddocConstruct
  .constructFieldString()
  .setDescription('First name')
  .setExample('Jesus');
const lastName = mddocConstruct
  .constructFieldString()
  .setDescription('Last name')
  .setExample('Christ');
const password = mddocConstruct
  .constructFieldString()
  .setDescription('Password');
const emailAddress = mddocConstruct
  .constructFieldString()
  .setDescription('Email address, case insensitive')
  .setExample('my-email-address@email-domain.com');
const foldername = mddocConstruct
  .constructFieldString()
  .setDescription('Folder name, case insensitive')
  .setExample('my-folder');
const filename = mddocConstruct
  .constructFieldString()
  .setDescription('File name, case insensitive')
  .setExample('my-file');
const folderpath = mddocConstruct
  .constructFieldString()
  .setDescription('Folder path with workspace rootname, case insensitive')
  .setExample('/workspace-rootname/my-outer-folder/my-inner-folder');
const folderpathList = mddocConstruct
  .constructFieldArray<string>()
  .setType(folderpath);
const folderpathOrList = mddocConstruct
  .constructFieldOrCombination<string | string[]>()
  .setTypes([folderpath, folderpathList]);
const filepath = mddocConstruct
  .constructFieldString()
  .setDescription('File path with workspace rootname, case insensitive')
  .setExample('/workspace-rootname/my-outer-folder/my-image-file.png');
const filepathOrId = mddocConstruct
  .constructFieldString()
  .setDescription(
    'File path with workspace rootname (case insensitive) or file ID'
  )
  .setExample(
    '/workspace-rootname/folder/file.ext or file000-remaining-file-id'
  );
const filepathList = mddocConstruct
  .constructFieldArray<string>()
  .setType(filepath);
const filepathOrList = mddocConstruct
  .constructFieldOrCombination<string | string[]>()
  .setTypes([filepath, filepathList]);
const foldernamepath = mddocConstruct
  .constructFieldArray<string>()
  .setType(foldername)
  .setDescription('List of parent folder names, case insensitive');
const action = mddocConstruct
  .constructFieldString()
  .setDescription('Action')
  .setExample(kFimidaraPermissionActions.uploadFile)
  .setValid(Object.values(kFimidaraPermissionActions))
  .setEnumName('FimidaraPermissionAction');
const actionList = mddocConstruct
  .constructFieldArray<FimidaraPermissionAction>()
  .setType(action);
const actionOrList = mddocConstruct
  .constructFieldOrCombination<
    FimidaraPermissionAction | FimidaraPermissionAction[]
  >()
  .setTypes([action, actionList]);
const resourceType = mddocConstruct
  .constructFieldString()
  .setDescription('Resource type')
  .setExample(kFimidaraPublicResourceType.File)
  .setValid(Object.values(kFimidaraPublicResourceType))
  .setEnumName('FimidaraResourceType');
const usageCategory = mddocConstruct
  .constructFieldString()
  .setDescription('Usage record category')
  .setExample(kUsageRecordCategory.storage)
  .setValid(Object.values(kUsageRecordCategory))
  .setEnumName('UsageRecordCategory');
const usageCategoryList = mddocConstruct
  .constructFieldArray<UsageRecordCategory>()
  .setType(usageCategory);
const usageCategoryOrList = mddocConstruct
  .constructFieldOrCombination<UsageRecordCategory | UsageRecordCategory[]>()
  .setTypes([usageCategory, usageCategoryList]);
const usageFulfillmentStatus = mddocConstruct
  .constructFieldString()
  .setDescription('Usage record fulfillment status')
  .setExample(kUsageRecordFulfillmentStatus.fulfilled)
  .setValid(Object.values(kUsageRecordFulfillmentStatus))
  .setEnumName('UsageRecordFulfillmentStatus');
const usageFulfillmentStatusList = mddocConstruct
  .constructFieldArray<UsageRecordFulfillmentStatus>()
  .setType(usageFulfillmentStatus);
const usageFulfillmentStatusOrList = mddocConstruct
  .constructFieldOrCombination<
    UsageRecordFulfillmentStatus | UsageRecordFulfillmentStatus[]
  >()
  .setTypes([usageFulfillmentStatus, usageFulfillmentStatusList]);
const page = mddocConstruct
  .constructFieldNumber()
  .setDescription(
    'Paginated list page number. Page is zero-based, meaning page numbering starts from 0, 1, 2, 3, ..'
  )
  .setExample(0)
  .setMin(kEndpointConstants.minPage);
const pageSize = mddocConstruct
  .constructFieldNumber()
  .setDescription('Paginated list page size')
  .setExample(10)
  .setMin(kEndpointConstants.minPageSize)
  .setMax(kEndpointConstants.maxPageSize);
const resultNoteCode = mddocConstruct
  .constructFieldString()
  .setDescription('Endpoint result or error note code')
  .setExample(kEndpointResultNoteCodeMap.unsupportedOperationInMountBackend)
  .setValid(Object.values(kEndpointResultNoteCodeMap))
  .setEnumName('EndpointResultNoteCode');
const resultNoteMessage = mddocConstruct
  .constructFieldString()
  .setDescription('Endpoint result or error note message')
  .setExample(
    "Some mounts in the requested folder's mount chain do not support operation abc"
  );
const resultNote = mddocConstruct
  .constructFieldObject<EndpointResultNote>()
  .setName('EndpointResultNote')
  .setFields({
    code: mddocConstruct.constructFieldObjectField(true, resultNoteCode),
    message: mddocConstruct.constructFieldObjectField(true, resultNoteMessage),
  });
const resultNoteList = mddocConstruct
  .constructFieldArray<EndpointResultNote>()
  .setType(resultNote);
const resourceParts: FieldObjectFieldsMap<PublicResource> = {
  resourceId: mddocConstruct.constructFieldObjectField(true, id),
  createdBy: mddocConstruct.constructFieldObjectField(false, agent),
  createdAt: mddocConstruct.constructFieldObjectField(true, date),
  lastUpdatedBy: mddocConstruct.constructFieldObjectField(false, agent),
  lastUpdatedAt: mddocConstruct.constructFieldObjectField(true, date),
  isDeleted: mddocConstruct.constructFieldObjectField(
    true,
    mddocConstruct.constructFieldBoolean()
  ),
  deletedAt: mddocConstruct.constructFieldObjectField(false, date),
  deletedBy: mddocConstruct.constructFieldObjectField(false, agent),
};
const workspaceResourceParts: FieldObjectFieldsMap<PublicWorkspaceResource> = {
  ...resourceParts,
  workspaceId: mddocConstruct.constructFieldObjectField(true, workspaceId),
  createdBy: mddocConstruct.constructFieldObjectField(true, agent),
  lastUpdatedBy: mddocConstruct.constructFieldObjectField(true, agent),
};
const usage = mddocConstruct
  .constructFieldNumber()
  .setDescription(
    `Usage amount. Bytes for ${kUsageRecordCategory.storage}, ${kUsageRecordCategory.bandwidthIn}, and ${kUsageRecordCategory.bandwidthOut}. Always 0 for ${kUsageRecordCategory.total}, use \`usageCost\` instead`
  );

export const fReusables = {
  usage,
  agent,
  date,
  id,
  idList,
  name,
  description,
  expires,
  duration,
  workspaceId,
  tokenString,
  refreshTokenString,
  effectOnReferenced,
  providedResourceId,
  workspaceName,
  idOrList,
  workspaceRootname,
  firstName,
  lastName,
  emailAddress,
  folderId,
  idPath,
  foldername,
  foldernamepath,
  filename,
  folderpath,
  filepath,
  fileId,
  filepathOrId,
  action,
  actionList,
  resourceType,
  permissionGroupId,
  permissionItemId,
  page,
  pageSize,
  workspaceIdInput,
  jobId,
  usageCategory,
  usageFulfillmentStatus,
  password,
  folderIdOrNull,
  filepathList,
  folderpathList,
  usageCategoryList,
  providedResourceIdOrNull,
  filepathOrList,
  folderpathOrList,
  actionOrList,
  usageCategoryOrList,
  usageFulfillmentStatusList,
  usageFulfillmentStatusOrList,
  dateOrNull,
  nullValue,
  resultNote,
  resultNoteCode,
  resultNoteList,
  resourceParts,
  workspaceResourceParts,
  jobIds,
  jwtTokenExpiresAt,
};

const errorObject = mddocConstruct
  .constructFieldObject<FimidaraExternalError>()
  .setName('OperationError')
  .setFields({
    name: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldString()
        .setDescription('Error name')
        .setExample('ValidationError')
    ),
    message: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldString()
        .setDescription('Error message')
        .setExample('Workspace name is invalid')
    ),
    action: mddocConstruct.constructFieldObjectField(
      false,
      mddocConstruct
        .constructFieldString()
        .setDescription('Recommended action')
        .setValid(Object.values(ServerRecommendedActionsMap))
    ),
    field: mddocConstruct.constructFieldObjectField(
      false,
      mddocConstruct
        .constructFieldString()
        .setExample('workspace.innerField.secondInnerField')
        .setDescription(
          'Invalid field failing validation when error is ValidationError'
        )
    ),
    notes: mddocConstruct.constructFieldObjectField(false, resultNoteList),
  });

const errorResponseBody = mddocConstruct
  .constructFieldObject<BaseEndpointResult>()
  .setName('EndpointErrorResult')
  .setFields({
    errors: mddocConstruct.constructFieldObjectField(
      false,
      mddocConstruct
        .constructFieldArray<FimidaraExternalError>()
        .setType(errorObject)
        .setDescription('Endpoint call response errors')
    ),
  })
  .setDescription('Endpoint error result');

const emptySuccessResponseBody = mddocConstruct
  .constructFieldObject<AnyObject>()
  .setName('EmptyEndpointResult')
  .setFields({})
  .setDescription('Empty endpoint success result');

const longRunningJobResponseBody = mddocConstruct
  .constructFieldObject<LongRunningJobResult>()
  .setName('LongRunningJobResult')
  .setFields({
    jobId: mddocConstruct.constructFieldObjectField(false, jobId),
  })
  .setDescription('Long running job endpoint success result');

const multipleLongRunningJobResponseBody = mddocConstruct
  .constructFieldObject<MultipleLongRunningJobResult>()
  .setName('MultipleLongRunningJobResult')
  .setFields({
    jobIds: mddocConstruct.constructFieldObjectField(true, jobIds),
  })
  .setDescription('Long running job endpoint success result');

const countResponseBody = mddocConstruct
  .constructFieldObject<CountItemsEndpointResult>()
  .setName('CountItemsResult')
  .setFields({
    count: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldNumber().setDescription('Resource count')
    ),
  })
  .setDescription('Count endpoint success result');

export const mddocEndpointHttpResponseItems = {
  errorResponseBody,
  emptySuccessResponseBody,
  longRunningJobResponseBody,
  countResponseBody,
  multipleLongRunningJobResponseBody,
};
