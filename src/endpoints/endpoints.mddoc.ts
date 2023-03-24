import {customAlphabet} from 'nanoid';
import {IAssignPermissionGroupInput} from '../definitions/permissionGroups';
import {
  AppActionType,
  AppResourceType,
  getNonWorkspaceActionList,
  IAgent,
  RESOURCE_TYPE_SHORT_NAMES,
  VALID_AGENT_TYPES,
} from '../definitions/system';
import {
  asFieldObjectAny,
  cloneAndMarkNotRequired,
  FieldArray,
  FieldBoolean,
  FieldDate,
  FieldNumber,
  FieldObject,
  FieldOrCombination,
  FieldString,
  FieldUndefined,
  HttpEndpointHeaderItem,
  HttpEndpointHeaders,
  HttpEndpointResponse,
  orUndefined,
} from '../mddoc/mddoc';
import {ID_SEPARATOR} from '../utils/resourceId';
import {endpointConstants} from './constants';
import {permissionGroupConstants} from './permissionGroups/constants';
import {IBaseEndpointResult} from './types';

export const endpointStatusCodes = {
  success: `${endpointConstants.httpStatusCode.ok}`,
  error: '4XX or 5XX',
};

const authorizationHeaderItem = new HttpEndpointHeaderItem()
  .setName('Authorization')
  .setType(
    new FieldString().setRequired(true).setDescription('Access token.').setExample('Bearer <token>')
  )
  .setRequired(true)
  .setDescription('User, client, or program access token.');

const requestContentTypeHeaderItem = new HttpEndpointHeaderItem()
  .setName('Content-Type')
  .setType(
    new FieldString()
      .setRequired(true)
      .setDescription('HTTP request content type.')
      .setExample('application/json or multipart/form-data')
  )
  .setRequired(true)
  .setDescription('HTTP request content type.');

const jsonRequestContentTypeHeaderItem = new HttpEndpointHeaderItem()
  .setName('Content-Type')
  .setType(
    new FieldString()
      .setRequired(true)
      .setDescription('HTTP JSON request content type.')
      .setExample('application/json')
      .setValid(['application/json'])
  )
  .setRequired(true)
  .setDescription('HTTP JSON request content type.');

const multipartFormdataRequestContentTypeHeaderItem = new HttpEndpointHeaderItem()
  .setName('Content-Type')
  .setType(
    new FieldString()
      .setRequired(true)
      .setDescription('HTTP multipart form-data request content type.')
      .setExample('multipart/form-data')
      .setValid(['multipart/form-data'])
  )
  .setRequired(true)
  .setDescription('HTTP multipart form-data request content type.');

const jsonResponseContentTypeHeaderItem = new HttpEndpointHeaderItem()
  .setName('Content-Type')
  .setType(
    new FieldString()
      .setRequired(true)
      .setDescription('HTTP JSON response content type.')
      .setExample(undefined)
      .setValid(['application/json'])
  )
  .setRequired(true)
  .setDescription('HTTP JSON response content type.');

const responseContentTypeHeaderItem = new HttpEndpointHeaderItem()
  .setName('Content-Type')
  .setType(
    new FieldString()
      .setRequired(true)
      .setDescription('HTTP response content type.')
      .setExample('application/json or application/octet-stream')
  )
  .setRequired(true)
  .setDescription('HTTP response content type.');

const responseContentLengthHeaderItem = new HttpEndpointHeaderItem()
  .setName('Content-Length')
  .setType(
    new FieldString().setRequired(true).setDescription('HTTP response content length in bytes.')
  )
  .setRequired(true)
  .setDescription('HTTP response content length in bytes.');

const jsonWithAuthRequestHeaders = new HttpEndpointHeaders().setItems([
  authorizationHeaderItem,
  jsonRequestContentTypeHeaderItem,
]);

const authRequestHeaders = new HttpEndpointHeaders().setItems([authorizationHeaderItem]);
const jsonResponseHeaders = new HttpEndpointHeaders().setItems([
  jsonResponseContentTypeHeaderItem,
  responseContentLengthHeaderItem,
]);

export const endpointHttpHeaderItems = {
  authorizationHeaderItem,
  requestContentTypeHeaderItem,
  responseContentTypeHeaderItem,
  jsonResponseContentTypeHeaderItem,
  jsonRequestContentTypeHeaderItem,
  multipartFormdataRequestContentTypeHeaderItem,
  jsonWithAuthRequestHeaders,
  jsonResponseHeaders,
  authRequestHeaders,
  responseContentLengthHeaderItem,
};

const errorObject = new FieldObject().setName('OperationError').setFields({
  name: new FieldString()
    .setRequired(true)
    .setDescription('Error name.')
    .setExample('ValidationError'),
  message: new FieldString()
    .setRequired(true)
    .setDescription('Error message.')
    .setExample('Workspace name is invalid.'),
  field: new FieldOrCombination()
    .setDescription('Invalid field failing validation when error is ValidationError.')
    .setTypes([
      new FieldString().setRequired(true).setExample('workspace.innerField.secondInnerField'),
      new FieldUndefined(),
    ]),
});

const errorResponse = new HttpEndpointResponse()
  .setStatusCode(endpointStatusCodes.error)
  .setResponseHeaders(jsonResponseHeaders)
  .setResponseBody(
    asFieldObjectAny(
      new FieldObject<IBaseEndpointResult>()
        .setName('EndpointErrorResult')
        .setFields({
          errors: new FieldArray()
            .setType(errorObject)
            .setDescription('Endpoint call response errors.'),
        })
        .setRequired(true)
        .setDescription('Endpoint error result.')
    )
  );

const emptySuccessResponse = new HttpEndpointResponse()
  .setStatusCode(endpointStatusCodes.success)
  .setResponseHeaders(jsonResponseHeaders)
  .setResponseBody(
    asFieldObjectAny(
      new FieldObject<{}>()
        .setName('EmptyEndpointSuccessResult')
        .setFields({})
        .setRequired(true)
        .setDescription('Empty endpoint success result.')
    )
  );

const emptyEndpointResponse = [emptySuccessResponse, errorResponse];

export const endpointHttpResponseItems = {
  errorResponse,
  emptySuccessResponse,
  emptyEndpointResponse,
};

const agent = new FieldObject<IAgent>().setName('Agent').setFields({
  agentId: new FieldString()
    .setRequired(true)
    .setDescription('Agent ID. Possible agents are users and agent tokens.'),
  agentType: new FieldString()
    .setRequired(true)
    .setDescription('Agent type')
    .setExample(AppResourceType.AgentToken)
    .setValid(VALID_AGENT_TYPES),
  agentTokenId: new FieldString().setRequired(true).setDescription('Agent token ID.'),
});
const date = new FieldString().setRequired(false).setDescription('Date string.');
const id = new FieldString()
  .setRequired(false)
  .setDescription('Resource ID.')
  .setExample(
    `${RESOURCE_TYPE_SHORT_NAMES[AppResourceType.Workspace]}${ID_SEPARATOR}${customAlphabet('0')()}`
  );
const workspaceId = new FieldString()
  .setRequired(false)
  .setDescription('Workspace ID.')
  .setExample(
    `${RESOURCE_TYPE_SHORT_NAMES[AppResourceType.Workspace]}${ID_SEPARATOR}${customAlphabet('0')()}`
  );
const folderId = new FieldString()
  .setRequired(false)
  .setDescription('Folder ID.')
  .setExample(
    `${RESOURCE_TYPE_SHORT_NAMES[AppResourceType.Folder]}${ID_SEPARATOR}${customAlphabet('0')()}`
  );
const fileId = new FieldString()
  .setRequired(false)
  .setDescription('File ID.')
  .setExample(
    `${RESOURCE_TYPE_SHORT_NAMES[AppResourceType.File]}${ID_SEPARATOR}${customAlphabet('0')()}`
  );
const permissionGroupId = new FieldString()
  .setRequired(false)
  .setDescription('Permission group ID.')
  .setExample(
    `${RESOURCE_TYPE_SHORT_NAMES[AppResourceType.PermissionGroup]}${ID_SEPARATOR}${customAlphabet(
      '0'
    )()}`
  );
const permissionItemId = new FieldString()
  .setRequired(false)
  .setDescription('Permission item ID.')
  .setExample(
    `${RESOURCE_TYPE_SHORT_NAMES[AppResourceType.PermissionItem]}${ID_SEPARATOR}${customAlphabet(
      '0'
    )()}`
  );
const idPath = new FieldArray().setType(folderId).setDescription('List of parent folder IDs.');
const name = new FieldString().setRequired(true).setDescription('Name');
const description = new FieldString().setRequired(true).setDescription('Description');
const expires = new FieldDate().setRequired(true).setDescription('Expiration date.');
const tokenString = new FieldString().setRequired(true).setDescription('JWT token string.');
const assignPermissionGroup = new FieldObject<IAssignPermissionGroupInput>()
  .setName('AssignPermissionGroupInput')
  .setFields({
    permissionGroupId: id,
  });
const assignPermissionGroupList = new FieldArray()
  .setType(assignPermissionGroup)
  .setMax(permissionGroupConstants.maxAssignedPermissionGroups);
const effectOnReferenced = new FieldBoolean().setDescription(
  'Whether to perform action on the token used to authorize the API call ' +
    'when performing actions on tokens and a token ID or provided resource ID is not provided.'
);
const providedResourceId = new FieldString()
  .setDescription('Resource ID provided by you.')
  .setMax(endpointConstants.providedResourceIdMaxLength);
const workspaceName = new FieldString()
  .setRequired(true)
  .setDescription('Workspace name.')
  .setExample('fimidara');

// TODO: set allowed characters for rootname and file and folder name
const workspaceRootname = new FieldString()
  .setRequired(true)
  .setDescription('Workspace root name, must be a URL compatible name.')
  .setExample('fimidara-rootname');
const firstName = new FieldString()
  .setRequired(true)
  .setDescription('First name.')
  .setExample('Jesus');
const lastName = new FieldString()
  .setRequired(true)
  .setDescription('Last name.')
  .setExample('Christ');
const emailAddress = new FieldString()
  .setRequired(true)
  .setDescription('Email address.')
  .setExample('my-email-address@email-domain.com');
const foldername = new FieldString()
  .setRequired(true)
  .setDescription('Folder name.')
  .setExample('my-folder');
const filename = new FieldString()
  .setRequired(true)
  .setDescription('File name.')
  .setExample('my-file');
const folderpath = new FieldString()
  .setRequired(true)
  .setDescription('Folder path with workspace rootname.')
  .setExample('/workspace-rootname/my-outer-folder/my-inner-folder');
const filepath = new FieldString()
  .setRequired(true)
  .setDescription('File path with workspace rootname.')
  .setExample('/workspace-rootname/my-outer-folder/my-image-file.png');
const folderNamePath = new FieldArray()
  .setType(foldername)
  .setDescription('List of parent folder names.');
const action = new FieldString()
  .setRequired(true)
  .setDescription('Action')
  .setExample(AppActionType.Create)
  .setValid(Object.values(AppActionType));
const nonWorkspaceAction = new FieldString()
  .setRequired(true)
  .setDescription('Action')
  .setExample(AppActionType.Create)
  .setValid(getNonWorkspaceActionList());
const resourceType = new FieldString()
  .setRequired(true)
  .setDescription('Resource type.')
  .setExample(AppResourceType.File)
  .setValid(Object.values(AppResourceType));
// const appliesTo = new FieldString()
//   .setRequired(true)
//   .setDescription(
//     "Whether this permission applies to both the containing folder and it's children, just the container, or just the children."
//   )
//   .setExample(PermissionItemAppliesTo.ContainerAndChildren)
//   .setValid(Object.values(PermissionItemAppliesTo));
const page = new FieldNumber()
  .setDescription(
    'Paginated list page number. Page is zero-based, meaning page numbering starts from 0, 1, 2, 3, ...'
  )
  .setExample(0)
  .setMin(endpointConstants.minPage);
const pageSize = new FieldNumber()
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
  // appliesTo,
  page,
  pageSize,
  dateOrUndefined: orUndefined(date),
  idOrUndefined: orUndefined(id),
  idNotRequired: cloneAndMarkNotRequired(id),
  nameNotRequired: cloneAndMarkNotRequired(name),
  descriptionOrUndefined: orUndefined(description),
  descriptionNotRequired: cloneAndMarkNotRequired(description),
  expiresOrUndefined: orUndefined(expires),
  expiresNotRequired: cloneAndMarkNotRequired(expires),
  assignPermissionGroupListNotRequired: cloneAndMarkNotRequired(assignPermissionGroupList),
  workspaceIdInputNotRequired: cloneAndMarkNotRequired(workspaceId).setDescription(
    'Workspace ID. Will default to using workspace ID from client and program tokens if not provided.'
  ),
  effectOnReferencedNotRequired: cloneAndMarkNotRequired(effectOnReferenced),
  providedResourceIdNotRequired: cloneAndMarkNotRequired(providedResourceId),
  providedResourceIdOrUndefined: orUndefined(providedResourceId),
  workspaceNameNotRequired: cloneAndMarkNotRequired(workspaceName),
  folderIdOrUndefined: orUndefined(folderId),
  folderIdNotRequied: cloneAndMarkNotRequired(folderId),
  folderpathNotRequired: cloneAndMarkNotRequired(folderpath),
  filepathNotRequired: cloneAndMarkNotRequired(filepath),
  fileIdNotRequired: cloneAndMarkNotRequired(fileId),
  pageNotRequired: cloneAndMarkNotRequired(page),
  pageSizeNotRequired: cloneAndMarkNotRequired(pageSize),
  rootnameNotRequired: cloneAndMarkNotRequired(workspaceRootname),
};
