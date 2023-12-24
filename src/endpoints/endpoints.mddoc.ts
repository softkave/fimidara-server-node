import {customAlphabet} from 'nanoid';
import {AssignPermissionGroupInput} from '../definitions/permissionGroups';
import {PermissionAction, kPermissionsMap} from '../definitions/permissionItem';
import {PublicAgent, VALID_AGENT_TYPES, kAppResourceType} from '../definitions/system';
import {
  UsageRecordCategory,
  UsageRecordCategoryMap,
  UsageRecordFulfillmentStatus,
  UsageRecordFulfillmentStatusMap,
} from '../definitions/usageRecord';
import {mddocConstruct} from '../mddoc/mddoc';
import {FimidaraExternalError} from '../utils/OperationError';
import {ID_SEPARATOR, RESOURCE_TYPE_SHORT_NAMES} from '../utils/resource';
import {AnyObject} from '../utils/types';
import {endpointConstants} from './constants';
import {LongRunningJobResult} from './jobs/types';
import {permissionGroupConstants} from './permissionGroups/constants';
import {
  BaseEndpointResult,
  CountItemsEndpointResult,
  EndpointResultNote,
  EndpointResultNoteCodeMap,
  HttpEndpointRequestHeaders_AuthOptional,
  HttpEndpointRequestHeaders_AuthOptional_ContentType,
  HttpEndpointRequestHeaders_AuthRequired,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointRequestHeaders_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
  ServerRecommendedActionsMap,
} from './types';

export const mddocEndpointStatusCodes = {
  success: `${endpointConstants.httpStatusCode.ok}`,
  error: '4XX or 5XX',
} as const;

const requestHeaderItem_JsonContentType = mddocConstruct
  .constructFieldString()
  .setDescription('HTTP JSON request content type.')
  .setExample('application/json');
const requestHeaderItem_MultipartFormdataContentType = mddocConstruct
  .constructFieldString()
  .setDescription('HTTP multipart form-data request content type.')
  .setExample('multipart/form-data')
  .setValid(['multipart/form-data']);
const responseHeaderItem_JsonContentType = mddocConstruct
  .constructFieldString()
  .setDescription('HTTP JSON response content type.')
  .setExample('application/json');
const responseHeaderItem_ContentLength = mddocConstruct
  .constructFieldString()
  .setDescription('HTTP response content length in bytes.');
const requestHeaderItem_Authorization = mddocConstruct
  .constructFieldString()
  .setDescription('Access token.')
  .setExample('Bearer <token>');
const requestHeaderItem_ContentType = mddocConstruct
  .constructFieldString()
  .setDescription('HTTP request content type.')
  .setExample('application/json or multipart/form-data');

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
        .setDescription('Agent ID. Possible agents are users and agent tokens.')
    ),
    agentType: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldString()
        .setDescription('Agent type.')
        .setExample(kAppResourceType.AgentToken)
        .setValid(VALID_AGENT_TYPES)
        .setEnumName('AgentType')
    ),
  });
const date = mddocConstruct
  .constructFieldNumber()
  .setDescription('UTC timestamp in milliseconds.');
const dateOrNull = mddocConstruct
  .constructFieldOrCombination<number | null>()
  .setTypes([date, nullValue]);
const id = mddocConstruct
  .constructFieldString()
  .setDescription('Resource ID.')
  .setExample(
    `${
      RESOURCE_TYPE_SHORT_NAMES[kAppResourceType.Workspace]
    }${ID_SEPARATOR}${customAlphabet('0')()}`
  );
const idList = mddocConstruct
  .constructFieldArray<string>()
  .setType(id)
  .setDescription('List of resource IDs.');
const idOrList = mddocConstruct
  .constructFieldOrCombination<string | string[]>()
  .setTypes([id, idList]);
const jobId = mddocConstruct
  .constructFieldString()
  .setDescription('Long running job ID.')
  .setExample(
    `${RESOURCE_TYPE_SHORT_NAMES[kAppResourceType.Job]}${ID_SEPARATOR}${customAlphabet(
      '0'
    )()}`
  );
const workspaceId = mddocConstruct
  .constructFieldString()
  .setDescription(
    'Workspace ID. When not provided, will default to using workspace ID from agent token.'
  )
  .setExample(
    `${
      RESOURCE_TYPE_SHORT_NAMES[kAppResourceType.Workspace]
    }${ID_SEPARATOR}${customAlphabet('0')()}`
  );
const workspaceIdInput = workspaceId
  .clone()
  .setDescription(
    'Workspace ID. When not provided, will default to using workspace ID from agent token.'
  );

const folderId = mddocConstruct
  .constructFieldString()
  .setDescription('Folder ID.')
  .setExample(
    `${RESOURCE_TYPE_SHORT_NAMES[kAppResourceType.Folder]}${ID_SEPARATOR}${customAlphabet(
      '0'
    )()}`
  );
const folderIdOrNull = mddocConstruct
  .constructFieldOrCombination<string | null>()
  .setTypes([folderId, mddocConstruct.constructFieldNull()]);
const fileId = mddocConstruct
  .constructFieldString()
  .setDescription('File ID.')
  .setExample(
    `${RESOURCE_TYPE_SHORT_NAMES[kAppResourceType.File]}${ID_SEPARATOR}${customAlphabet(
      '0'
    )()}`
  );
const permissionGroupId = mddocConstruct
  .constructFieldString()
  .setDescription('Permission group ID.')
  .setExample(
    `${
      RESOURCE_TYPE_SHORT_NAMES[kAppResourceType.PermissionGroup]
    }${ID_SEPARATOR}${customAlphabet('0')()}`
  );
const permissionItemId = mddocConstruct
  .constructFieldString()
  .setDescription('Permission item ID.')
  .setExample(
    `${
      RESOURCE_TYPE_SHORT_NAMES[kAppResourceType.PermissionItem]
    }${ID_SEPARATOR}${customAlphabet('0')()}`
  );
const idPath = mddocConstruct
  .constructFieldArray<string>()
  .setType(folderId)
  .setDescription('List of parent folder IDs.');
const name = mddocConstruct.constructFieldString().setDescription('Name');
const description = mddocConstruct.constructFieldString().setDescription('Description');
const expires = mddocConstruct.constructFieldNumber().setDescription('Expiration date.');
const duration = mddocConstruct
  .constructFieldNumber()
  .setDescription('Time duration in milliseconds, for example, 1000 for 1 second.');
const tokenString = mddocConstruct
  .constructFieldString()
  .setDescription('JWT token string.');
const assignPermissionGroup = mddocConstruct
  .constructFieldObject<AssignPermissionGroupInput>()
  .setName('AssignPermissionGroupInput')
  .setFields({
    permissionGroupId: mddocConstruct.constructFieldObjectField(true, id),
  });
const assignPermissionGroupList = mddocConstruct
  .constructFieldArray<AssignPermissionGroupInput>()
  .setType(assignPermissionGroup)
  .setMax(permissionGroupConstants.maxAssignedPermissionGroups);
const effectOnReferenced = mddocConstruct
  .constructFieldBoolean()
  .setDescription(
    'Whether to perform action on the token used to authorize the API call ' +
      'when performing actions on tokens and a token ID or provided resource ID is not provided.' +
      'Defaults to true if a call is made and a token ID is not provided.'
  );
const providedResourceId = mddocConstruct
  .constructFieldString()
  .setDescription('Resource ID provided by you.')
  .setMax(endpointConstants.providedResourceIdMaxLength);
const providedResourceIdOrNull = mddocConstruct
  .constructFieldOrCombination<string | null>()
  .setTypes([providedResourceId, nullValue]);
const workspaceName = mddocConstruct
  .constructFieldString()
  .setDescription('Workspace name.')
  .setExample('fimidara');

// TODO: set allowed characters for rootname and file and folder name
const workspaceRootname = mddocConstruct
  .constructFieldString()
  .setDescription('Workspace root name, must be a URL compatible name.')
  .setExample('fimidara-rootname');
const firstName = mddocConstruct
  .constructFieldString()
  .setDescription('First name.')
  .setExample('Jesus');
const lastName = mddocConstruct
  .constructFieldString()
  .setDescription('Last name.')
  .setExample('Christ');
const password = mddocConstruct.constructFieldString().setDescription('Password.');
const emailAddress = mddocConstruct
  .constructFieldString()
  .setDescription('Email address.')
  .setExample('my-email-address@email-domain.com');
const foldername = mddocConstruct
  .constructFieldString()
  .setDescription('Folder name.')
  .setExample('my-folder');
const filename = mddocConstruct
  .constructFieldString()
  .setDescription('File name.')
  .setExample('my-file');
const folderpath = mddocConstruct
  .constructFieldString()
  .setDescription('Folder path with workspace rootname.')
  .setExample('/workspace-rootname/my-outer-folder/my-inner-folder');
const folderpathList = mddocConstruct.constructFieldArray<string>().setType(folderpath);
const folderpathOrList = mddocConstruct
  .constructFieldOrCombination<string | string[]>()
  .setTypes([folderpath, folderpathList]);
const filepath = mddocConstruct
  .constructFieldString()
  .setDescription('File path with workspace rootname.')
  .setExample('/workspace-rootname/my-outer-folder/my-image-file.png');
const filepathOrId = mddocConstruct
  .constructFieldString()
  .setDescription('File path with workspace rootname or file ID.')
  .setExample('/workspace-rootname/folder/file.extension or file000-remaining-file-id');
const filepathList = mddocConstruct.constructFieldArray<string>().setType(filepath);
const filepathOrList = mddocConstruct
  .constructFieldOrCombination<string | string[]>()
  .setTypes([filepath, filepathList]);
const foldernamepath = mddocConstruct
  .constructFieldArray<string>()
  .setType(foldername)
  .setDescription('List of parent folder names.');
const action = mddocConstruct
  .constructFieldString()
  .setDescription('Action')
  .setExample(kPermissionsMap.addFile)
  .setValid(Object.values(kPermissionsMap))
  .setEnumName('AppActionType');
const actionList = mddocConstruct.constructFieldArray<PermissionAction>().setType(action);
const actionOrList = mddocConstruct
  .constructFieldOrCombination<PermissionAction | PermissionAction[]>()
  .setTypes([action, actionList]);
const resourceType = mddocConstruct
  .constructFieldString()
  .setDescription('Resource type.')
  .setExample(kAppResourceType.File)
  .setValid(Object.values(kAppResourceType))
  .setEnumName('AppResourceType');
const usageCategory = mddocConstruct
  .constructFieldString()
  .setDescription('Usage record category.')
  .setExample(UsageRecordCategoryMap.Storage)
  .setValid(Object.values(UsageRecordCategoryMap))
  .setEnumName('UsageRecordCategory');
const usageCategoryList = mddocConstruct
  .constructFieldArray<UsageRecordCategory>()
  .setType(usageCategory);
const usageCategoryOrList = mddocConstruct
  .constructFieldOrCombination<UsageRecordCategory | UsageRecordCategory[]>()
  .setTypes([usageCategory, usageCategoryList]);
const usageFulfillmentStatus = mddocConstruct
  .constructFieldString()
  .setDescription('Usage record fulfillment status.')
  .setExample(UsageRecordFulfillmentStatusMap.Fulfilled)
  .setValid(Object.values(UsageRecordFulfillmentStatusMap))
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
    'Paginated list page number. Page is zero-based, meaning page numbering starts from 0, 1, 2, 3, ...'
  )
  .setExample(0)
  .setMin(endpointConstants.minPage);
const pageSize = mddocConstruct
  .constructFieldNumber()
  .setDescription('Paginated list page size.')
  .setExample(10)
  .setMin(endpointConstants.minPageSize)
  .setMax(endpointConstants.maxPageSize);
const resultNoteCode = mddocConstruct
  .constructFieldString()
  .setDescription('Endpoint result or error note code.')
  .setExample(EndpointResultNoteCodeMap.unsupportedOperationInMountBackend)
  .setValid(Object.values(EndpointResultNoteCodeMap))
  .setEnumName('EndpointResultNoteCode');
const resultNoteMessage = mddocConstruct
  .constructFieldString()
  .setDescription('Endpoint result or error note message.')
  .setExample(
    "Some mounts in the requested folder's mount chain do not support operation abc."
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

export const fReusables = {
  agent,
  date,
  id,
  idList,
  name,
  description,
  expires,
  duration,
  assignPermissionGroup,
  assignPermissionGroupList,
  workspaceId,
  tokenString,
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
};

const errorObject = mddocConstruct
  .constructFieldObject<FimidaraExternalError>()
  .setName('OperationError')
  .setFields({
    name: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldString()
        .setDescription('Error name.')
        .setExample('ValidationError')
    ),
    message: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldString()
        .setDescription('Error message.')
        .setExample('Workspace name is invalid.')
    ),
    action: mddocConstruct.constructFieldObjectField(
      false,
      mddocConstruct
        .constructFieldString()
        .setDescription('Recommended action.')
        .setValid(Object.values(ServerRecommendedActionsMap))
    ),
    field: mddocConstruct.constructFieldObjectField(
      false,
      mddocConstruct
        .constructFieldString()
        .setExample('workspace.innerField.secondInnerField')
        .setDescription('Invalid field failing validation when error is ValidationError.')
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
        .setDescription('Endpoint call response errors.')
    ),
  })
  .setDescription('Endpoint error result.');

const emptySuccessResponseBody = mddocConstruct
  .constructFieldObject<AnyObject>()
  .setName('EmptyEndpointResult')
  .setFields({})
  .setDescription('Empty endpoint success result.');

const longRunningJobResponseBody = mddocConstruct
  .constructFieldObject<LongRunningJobResult>()
  .setName('LongRunningJobResult')
  .setFields({
    jobId: mddocConstruct.constructFieldObjectField(false, jobId),
  })
  .setDescription('Long running job endpoint success result.');

const countResponseBody = mddocConstruct
  .constructFieldObject<CountItemsEndpointResult>()
  .setName('CountItemsResult')
  .setFields({
    count: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldNumber().setDescription('Resource count.')
    ),
  })
  .setDescription('Count endpoint success result.');

export const mddocEndpointHttpResponseItems = {
  errorResponseBody,
  emptySuccessResponseBody,
  longRunningJobResponseBody,
  countResponseBody,
};
