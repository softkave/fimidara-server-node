import {customAlphabet} from 'nanoid';
import {AssignPermissionGroupInput} from '../definitions/permissionGroups';
import {PermissionItemAppliesTo} from '../definitions/permissionItem';
import {
  AppActionType,
  AppResourceType,
  PublicAgent,
  VALID_AGENT_TYPES,
  getNonWorkspaceActionList,
} from '../definitions/system';
import {UsageRecordCategory, UsageRecordFulfillmentStatus} from '../definitions/usageRecord';
import {
  FieldArray,
  FieldBoolean,
  FieldDate,
  FieldNumber,
  FieldObject,
  FieldOrCombination,
  FieldString,
  FieldUndefined,
} from '../mddoc/mddoc';
import {EndpointExportedError} from '../utils/OperationError';
import {ID_SEPARATOR, RESOURCE_TYPE_SHORT_NAMES} from '../utils/resource';
import {AnyObject} from '../utils/types';
import {endpointConstants} from './constants';
import {LongRunningJobResult} from './jobs/types';
import {permissionGroupConstants} from './permissionGroups/constants';
import {BaseEndpointResult, CountItemsEndpointResult, ServerRecommendedActions} from './types';

export const mddocEndpointStatusCodes = {
  success: `${endpointConstants.httpStatusCode.ok}`,
  error: '4XX or 5XX',
} as const;

export type MddocEndpointRequestHeaders_ContentType = {
  'Content-Type': string;
};
export type MddocEndpointRequestHeaders_AuthRequired_ContentType = {
  Authorization: string;
  'Content-Type': string;
};
export type MddocEndpointRequestHeaders_AuthOptional_ContentType = {
  Authorization?: string;
  'Content-Type': string;
};
export type MddocEndpointRequestHeaders_AuthRequired = {
  Authorization: string;
};
export type MddocEndpointRequestHeaders_AuthOptional = {
  Authorization?: string;
};
export type MddocEndpointResponseHeaders_ContentType_ContentLength = {
  'Content-Type': string;
  'Content-Length': string;
};

const requestHeaderItem_JsonContentType = FieldString.construct()
  .setRequired(true)
  .setDescription('HTTP JSON request content type.')
  .setExample('application/json')
  .setValid(['application/json']);
const requestHeaderItem_MultipartFormdataContentType = FieldString.construct()
  .setRequired(true)
  .setDescription('HTTP multipart form-data request content type.')
  .setExample('multipart/form-data')
  .setValid(['multipart/form-data']);
const responseHeaderItem_JsonContentType = FieldString.construct()
  .setRequired(true)
  .setDescription('HTTP JSON response content type.')
  .setExample(undefined)
  .setValid(['application/json']);
const responseHeaderItem_ContentLength = FieldString.construct()
  .setRequired(true)
  .setDescription('HTTP response content length in bytes.');
const requestHeaderItem_Authorization = FieldString.construct()
  .setRequired(true)
  .setDescription('Access token.')
  .setExample('Bearer <token>');
const requestHeaderItem_ContentType = FieldString.construct()
  .setRequired(true)
  .setDescription('HTTP request content type.')
  .setExample('application/json or multipart/form-data');

const requestHeaders_AuthRequired_JsonContentType =
  FieldObject.construct<MddocEndpointRequestHeaders_AuthRequired_ContentType>().setFields({
    Authorization: FieldObject.requiredField(requestHeaderItem_Authorization),
    'Content-Type': FieldObject.requiredField(requestHeaderItem_JsonContentType),
  });
const requestHeaders_AuthOptional_JsonContentType =
  FieldObject.construct<MddocEndpointRequestHeaders_AuthOptional_ContentType>().setFields({
    Authorization: FieldObject.optionalField(requestHeaderItem_Authorization),
    'Content-Type': FieldObject.requiredField(requestHeaderItem_JsonContentType),
  });
const requestHeaders_JsonContentType =
  FieldObject.construct<MddocEndpointRequestHeaders_ContentType>().setFields({
    'Content-Type': FieldObject.requiredField(requestHeaderItem_JsonContentType),
  });
const requestHeaders_AuthRequired_MultipartContentType =
  FieldObject.construct<MddocEndpointRequestHeaders_AuthRequired_ContentType>().setFields({
    Authorization: FieldObject.requiredField(requestHeaderItem_Authorization),
    'Content-Type': FieldObject.requiredField(requestHeaderItem_MultipartFormdataContentType),
  });
const requestHeaders_AuthOptional_MultipartContentType =
  FieldObject.construct<MddocEndpointRequestHeaders_AuthOptional_ContentType>().setFields({
    Authorization: FieldObject.optionalField(requestHeaderItem_Authorization),
    'Content-Type': FieldObject.requiredField(requestHeaderItem_MultipartFormdataContentType),
  });
const requestHeaders_MultipartContentType =
  FieldObject.construct<MddocEndpointRequestHeaders_ContentType>().setFields({
    'Content-Type': FieldObject.requiredField(requestHeaderItem_MultipartFormdataContentType),
  });
const requestHeaders_AuthRequired =
  FieldObject.construct<MddocEndpointRequestHeaders_AuthRequired>().setFields({
    Authorization: FieldObject.requiredField(requestHeaderItem_Authorization),
  });
const requestHeaders_AuthOptional =
  FieldObject.construct<MddocEndpointRequestHeaders_AuthOptional>().setFields({
    Authorization: FieldObject.optionalField(requestHeaderItem_Authorization),
  });
const responseHeaders_JsonContentType =
  FieldObject.construct<MddocEndpointResponseHeaders_ContentType_ContentLength>().setFields({
    'Content-Type': FieldObject.requiredField(responseHeaderItem_JsonContentType),
    'Content-Length': FieldObject.requiredField(responseHeaderItem_ContentLength),
  });

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

const agent = FieldObject.construct<PublicAgent>()
  .setName('Agent')
  .setFields({
    agentId: FieldObject.requiredField(
      FieldString.construct().setDescription(
        'Agent ID. Possible agents are users and agent tokens.'
      )
    ),
    agentType: FieldObject.requiredField(
      FieldString.construct()
        .setDescription('Agent type.')
        .setExample(AppResourceType.AgentToken)
        .setValid(VALID_AGENT_TYPES)
        .setEnumName('AgentType')
    ),
  });
const date = FieldNumber.construct().setDescription('UTC timestamp in milliseconds.');
const id = FieldString.construct()
  .setDescription('Resource ID.')
  .setExample(
    `${RESOURCE_TYPE_SHORT_NAMES[AppResourceType.Workspace]}${ID_SEPARATOR}${customAlphabet('0')()}`
  );
const jobId = FieldString.construct()
  .setDescription('Long running job ID.')
  .setExample(
    `${RESOURCE_TYPE_SHORT_NAMES[AppResourceType.Job]}${ID_SEPARATOR}${customAlphabet('0')()}`
  );
const workspaceId = FieldString.construct()
  .setDescription(
    'Workspace ID. When not provided, will default to using workspace ID from agent token.'
  )
  .setExample(
    `${RESOURCE_TYPE_SHORT_NAMES[AppResourceType.Workspace]}${ID_SEPARATOR}${customAlphabet('0')()}`
  );
const workspaceIdInput = workspaceId
  .clone()
  .setDescription(
    'Workspace ID. When not provided, will default to using workspace ID from agent token.'
  );

const folderId = FieldString.construct()
  .setDescription('Folder ID.')
  .setExample(
    `${RESOURCE_TYPE_SHORT_NAMES[AppResourceType.Folder]}${ID_SEPARATOR}${customAlphabet('0')()}`
  );
const fileId = FieldString.construct()
  .setDescription('File ID.')
  .setExample(
    `${RESOURCE_TYPE_SHORT_NAMES[AppResourceType.File]}${ID_SEPARATOR}${customAlphabet('0')()}`
  );
const permissionGroupId = FieldString.construct()
  .setDescription('Permission group ID.')
  .setExample(
    `${RESOURCE_TYPE_SHORT_NAMES[AppResourceType.PermissionGroup]}${ID_SEPARATOR}${customAlphabet(
      '0'
    )()}`
  );
const permissionItemId = FieldString.construct()
  .setDescription('Permission item ID.')
  .setExample(
    `${RESOURCE_TYPE_SHORT_NAMES[AppResourceType.PermissionItem]}${ID_SEPARATOR}${customAlphabet(
      '0'
    )()}`
  );
const idPath = FieldArray.construct<string>()
  .setType(folderId)
  .setDescription('List of parent folder IDs.');
const name = FieldString.construct().setDescription('Name');
const description = FieldString.construct().setDescription('Description');
const expires = FieldDate.construct().setDescription('Expiration date.');
const tokenString = FieldString.construct().setDescription('JWT token string.');
const assignPermissionGroup = FieldObject.construct<AssignPermissionGroupInput>()
  .setName('AssignPermissionGroupInput')
  .setFields({
    permissionGroupId: FieldObject.requiredField(id),
  });
const assignPermissionGroupList = FieldArray.construct()
  .setType(assignPermissionGroup)
  .setMax(permissionGroupConstants.maxAssignedPermissionGroups);
const effectOnReferenced = FieldBoolean.construct().setDescription(
  'Whether to perform action on the token used to authorize the API call ' +
    'when performing actions on tokens and a token ID or provided resource ID is not provided.'
);
const providedResourceId = FieldString.construct()
  .setDescription('Resource ID provided by you.')
  .setMax(endpointConstants.providedResourceIdMaxLength);
const workspaceName = FieldString.construct()
  .setDescription('Workspace name.')
  .setExample('fimidara');

// TODO: set allowed characters for rootname and file and folder name
const workspaceRootname = FieldString.construct()
  .setDescription('Workspace root name, must be a URL compatible name.')
  .setExample('fimidara-rootname');
const firstName = FieldString.construct().setDescription('First name.').setExample('Jesus');
const lastName = FieldString.construct().setDescription('Last name.').setExample('Christ');
const password = FieldString.construct().setDescription('Password.');
const emailAddress = FieldString.construct()
  .setDescription('Email address.')
  .setExample('my-email-address@email-domain.com');
const foldername = FieldString.construct().setDescription('Folder name.').setExample('my-folder');
const filename = FieldString.construct().setDescription('File name.').setExample('my-file');
const folderpath = FieldString.construct()
  .setDescription('Folder path with workspace rootname.')
  .setExample('/workspace-rootname/my-outer-folder/my-inner-folder');
const filepath = FieldString.construct()
  .setDescription('File path with workspace rootname.')
  .setExample('/workspace-rootname/my-outer-folder/my-image-file.png');
const folderNamePath = FieldArray.construct<string>()
  .setType(foldername)
  .setDescription('List of parent folder names.');
const action = FieldString.construct()
  .setDescription('Action')
  .setExample(AppActionType.Create)
  .setValid(Object.values(AppActionType))
  .setEnumName('AppActionType');
const nonWorkspaceAction = FieldString.construct()
  .setDescription('Action')
  .setExample(AppActionType.Create)
  .setValid(getNonWorkspaceActionList())
  .setEnumName('NonWorkspaceAppActionType');
const resourceType = FieldString.construct()
  .setDescription('Resource type.')
  .setExample(AppResourceType.File)
  .setValid(Object.values(AppResourceType))
  .setEnumName('AppResourceType');
const appliesTo = FieldString.construct()
  .setDescription(
    'Whether this permission applies to only to the target, or the target and children of same type, or only children of type declared in permission item.'
  )
  .setExample(PermissionItemAppliesTo.SelfAndChildrenOfType)
  .setValid(Object.values(PermissionItemAppliesTo))
  .setEnumName('PermissionItemAppliesTo');
const usageCategory = FieldString.construct()
  .setDescription('Usage record category.')
  .setExample(UsageRecordCategory.Storage)
  .setValid(Object.values(UsageRecordCategory))
  .setEnumName('UsageRecordCategory');
const usageFulfillmentStatus = FieldString.construct()
  .setDescription('Usage record fulfillment status.')
  .setExample(UsageRecordFulfillmentStatus.Fulfilled)
  .setValid(Object.values(UsageRecordFulfillmentStatus))
  .setEnumName('UsageRecordFulfillmentStatus');
const page = FieldNumber.construct()
  .setDescription(
    'Paginated list page number. Page is zero-based, meaning page numbering starts from 0, 1, 2, 3, ...'
  )
  .setExample(0)
  .setMin(endpointConstants.minPage);
const pageSize = FieldNumber.construct()
  .setDescription('Paginated list page size.')
  .setExample(10)
  .setMin(endpointConstants.minPageSize)
  .setMax(endpointConstants.maxPageSize);

export const fReusables = {
  agent,
  date,
  id,
  name,
  description,
  expires,
  assignPermissionGroup,
  assignPermissionGroupList,
  workspaceId,
  tokenString,
  effectOnReferenced,
  providedResourceId,
  workspaceName,
  workspaceRootname,
  firstName,
  lastName,
  emailAddress,
  folderId,
  idPath,
  foldername,
  folderNamePath,
  filename,
  folderpath,
  filepath,
  fileId,
  action,
  nonWorkspaceAction,
  resourceType,
  permissionGroupId,
  permissionItemId,
  appliesTo,
  page,
  pageSize,
  workspaceIdInput,
  jobId,
  usageCategory,
  usageFulfillmentStatus,
  password,
};

const errorObject = FieldObject.construct<EndpointExportedError>()
  .setName('OperationError')
  .setFields({
    name: FieldObject.requiredField(
      FieldString.construct().setDescription('Error name.').setExample('ValidationError')
    ),
    message: FieldObject.requiredField(
      FieldString.construct()
        .setDescription('Error message.')
        .setExample('Workspace name is invalid.')
    ),
    action: FieldObject.optionalField(
      FieldString.construct()
        .setDescription('Recommended action.')
        .setValid(Object.values(ServerRecommendedActions))
    ),
    field: FieldObject.optionalField(
      FieldOrCombination.construct()
        .setDescription('Invalid field failing validation when error is ValidationError.')
        .setTypes([
          FieldString.construct().setExample('workspace.innerField.secondInnerField'),
          FieldUndefined.construct(),
        ])
    ),
  });

const errorResponseBody = FieldObject.construct<BaseEndpointResult>()
  .setName('EndpointErrorResult')
  .setFields({
    errors: FieldObject.optionalField(
      FieldArray.construct().setType(errorObject).setDescription('Endpoint call response errors.')
    ),
  })
  .setRequired(true)
  .setDescription('Endpoint error result.');

const emptySuccessResponseBody = FieldObject.construct<AnyObject>()
  .setName('EmptyEndpointSuccessResult')
  .setFields({})
  .setRequired(true)
  .setDescription('Empty endpoint success result.');

const longRunningJobResponseBody = FieldObject.construct<LongRunningJobResult>()
  .setName('LongRunningJobResult')
  .setFields({
    jobId: FieldObject.requiredField(jobId),
  })
  .setRequired(true)
  .setDescription('Long running job endpoint success result.');

const countResponseBody = FieldObject.construct<CountItemsEndpointResult>()
  .setName('LongRunningJobResult')
  .setFields({
    count: FieldObject.requiredField(FieldNumber.construct().setDescription('Resource count.')),
  })
  .setRequired(true)
  .setDescription('Count endpoint success result.');

export const mddocEndpointHttpResponseItems = {
  errorResponseBody,
  emptySuccessResponseBody,
  longRunningJobResponseBody,
  countResponseBody,
};
