import {customAlphabet} from 'nanoid';
import {IAssignPermissionGroupInput} from '../definitions/permissionGroups';
import {AppResourceType, IAgent, resourceTypeShortNames, validAgentTypes} from '../definitions/system';
import {
  asFieldObjectAny,
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
  orUndefined,
} from '../mddoc/mddoc';
import {idSeparator} from '../utils/resourceId';
import {endpointConstants} from './constants';
import {permissionGroupConstants} from './permissionGroups/constants';
import {IBaseEndpointResult} from './types';

const authorizationHeaderItem = new HttpEndpointHeaderItem()
  .setName('Authorization')
  .setType(new FieldString().setRequired(true).setDescription('Access token').setExample('Bearer <token>'))
  .setRequired(true)
  .setDescription('User, client, or program access token');

const requestContentTypeHeaderItem = new HttpEndpointHeaderItem()
  .setName('Content-Type')
  .setType(
    new FieldString()
      .setRequired(true)
      .setDescription('HTTP request content type')
      .setExample('application/json or multipart/form-data')
  )
  .setRequired(true)
  .setDescription('HTTP request content type');

const jsonRequestContentTypeHeaderItem = new HttpEndpointHeaderItem()
  .setName('Content-Type')
  .setType(
    new FieldString()
      .setRequired(true)
      .setDescription('HTTP JSON request content type')
      .setExample('application/json')
      .setValid(['application/json'])
  )
  .setRequired(true)
  .setDescription('HTTP JSON request content type');

const multipartFormdataRequestContentTypeHeaderItem = new HttpEndpointHeaderItem()
  .setName('Content-Type')
  .setType(
    new FieldString()
      .setRequired(true)
      .setDescription('HTTP multipart form-data request content type')
      .setExample('multipart/form-data')
      .setValid(['multipart/form-data'])
  )
  .setRequired(true)
  .setDescription('HTTP multipart form-data request content type');

const jsonResponseContentTypeHeaderItem = new HttpEndpointHeaderItem()
  .setName('Content-Type')
  .setType(
    new FieldString()
      .setRequired(true)
      .setDescription('HTTP JSON response content type')
      .setExample(undefined)
      .setValid(['application/json'])
  )
  .setRequired(true)
  .setDescription('HTTP JSON response content type');

const binaryResponseContentTypeHeaderItem = new HttpEndpointHeaderItem()
  .setName('Content-Type')
  .setType(
    new FieldString()
      .setRequired(true)
      .setDescription('HTTP binary stream response content type')
      .setExample('File content type like image/png or application/octet-stream')
  )
  .setRequired(true)
  .setDescription('HTTP binary stream response content type');

const responseContentTypeHeaderItem = new HttpEndpointHeaderItem()
  .setName('Content-Type')
  .setType(
    new FieldString()
      .setRequired(true)
      .setDescription('HTTP response content type')
      .setExample('application/json or application/octet-stream')
  )
  .setRequired(true)
  .setDescription('HTTP response content type');

const jsonWithAuthRequestHeaders = new HttpEndpointHeaders().setItems([
  authorizationHeaderItem,
  jsonRequestContentTypeHeaderItem,
]);

const jsonResponseHeaders = new HttpEndpointHeaders().setItems([jsonResponseContentTypeHeaderItem]);

export const httpHeaderItems = {
  authorizationHeaderItem,
  requestContentTypeHeaderItem,
  responseContentTypeHeaderItem,
  jsonResponseContentTypeHeaderItem,
  binaryResponseContentTypeHeaderItem,
  jsonRequestContentTypeHeaderItem,
  multipartFormdataRequestContentTypeHeaderItem,
  jsonWithAuthRequestHeaders,
  jsonResponseHeaders,
};

const errorObject = new FieldObject().setName('OperationError').setFields({
  name: new FieldString().setRequired(true).setDescription('Error name').setExample('ValidationError'),
  message: new FieldString().setRequired(true).setDescription('Error message').setExample('Workspace name is invalid'),
  field: new FieldOrCombination()
    .setDescription('Invalid field failing validation when error is ValidationError')
    .setTypes([
      new FieldString().setRequired(true).setExample('workspace.innerField.secondInnerField'),
      new FieldUndefined(),
    ]),
});

const responseWithErrorRaw = {
  errors: new FieldOrCombination()
    .setTypes([new FieldArray().setType(errorObject), new FieldUndefined()])
    .setDescription('Endpoint call response errors'),
};

const defaultResponse = asFieldObjectAny(
  new FieldObject<IBaseEndpointResult>()
    .setName('EndpointResult')
    .setFields(responseWithErrorRaw)
    .setRequired(true)
    .setDescription('Endpoint result')
);

export const httpResponseItems = {
  responseWithErrorRaw,
  defaultResponse,
};

const agent = new FieldObject<IAgent>().setName('Agent').setFields({
  agentId: new FieldString().setRequired(true).setDescription('Agent ID'),
  agentType: new FieldString()
    .setRequired(true)
    .setDescription('Agent type')
    .setExample(AppResourceType.ProgramAccessToken)
    .setValid(validAgentTypes),
});
const date = new FieldString().setRequired(false).setDescription('Date string');
const id = new FieldString()
  .setRequired(false)
  .setDescription('Resource ID')
  .setExample(`${resourceTypeShortNames[AppResourceType.Workspace]}${idSeparator}${customAlphabet('0')()}`);
const workspaceId = new FieldString()
  .setRequired(false)
  .setDescription('Workspace ID')
  .setExample(`${resourceTypeShortNames[AppResourceType.Workspace]}${idSeparator}${customAlphabet('0')()}`);
const name = new FieldString().setRequired(true).setDescription('Name');
const description = new FieldString().setRequired(true).setDescription('Description');
const expires = new FieldDate().setRequired(true).setDescription('Expiration date');
const tokenString = new FieldString().setRequired(true).setDescription('JWT token string');
const assignPermissionGroup = new FieldObject<IAssignPermissionGroupInput>()
  .setName('AssignPermissionGroupInput')
  .setFields({
    permissionGroupId: id,
    order: new FieldNumber().setInteger(true).setMin(0),
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
const workspaceName = new FieldString().setRequired(true).setDescription('Workspace name').setExample('fimidara');
const workspaceRootname = new FieldString()
  .setRequired(true)
  .setDescription('Workspace root name, must be a URL compatible name')
  .setExample('fimidara-rootname');
const firstName = new FieldString().setRequired(true).setDescription('First name').setExample('Jesus');
const lastName = new FieldString().setRequired(true).setDescription('Last name').setExample('Christ');
const emailAddress = new FieldString()
  .setRequired(true)
  .setDescription('Email address')
  .setExample('my-email-address@email-domain.com');

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
  agentOrUndefined: orUndefined(agent),
  dateOrUndefined: orUndefined(date),
  idOrUndefined: orUndefined(id),
  nameOrUndefined: orUndefined(name),
  descriptionOrUndefined: orUndefined(description),
  expiresOrUndefined: orUndefined(expires),
  assignPermissionGroupOrUndefined: orUndefined(assignPermissionGroup),
  assignPermissionGroupListOrUndefined: orUndefined(assignPermissionGroupList),
  workspaceIdOrUndefined: orUndefined(workspaceId),
  workspaceIdInputOrUndefined: orUndefined(workspaceId).setDescription(
    'Will default to using workspace ID from client and program tokens if not provided.'
  ),
  tokenStringOrUndefined: orUndefined(tokenString),
  effectOnReferencedOrUndefined: orUndefined(effectOnReferenced),
  providedResourceIdOrUndefined: orUndefined(providedResourceId),
  workspaceNameOrUndefined: orUndefined(workspaceName),
  workspaceRootnameOrUndefined: orUndefined(workspaceRootname),
  firstNameOrUndefined: orUndefined(firstName),
  lastNameOrUndefined: orUndefined(lastName),
  emailAddressOrUndefined: orUndefined(emailAddress),
};
