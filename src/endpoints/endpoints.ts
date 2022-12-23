import {customAlphabet} from 'nanoid';
import {AppResourceType, IAgent, resourceTypeShortNames, validAgentTypes} from '../definitions/system';
import {
  FieldArray,
  FieldObject,
  FieldOrCombination,
  FieldString,
  FieldUndefined,
  HttpEndpointHeaderItem,
  HttpEndpointHeaders,
  orUndefined,
} from '../mddoc/mddoc';
import {idSeparator} from '../utils/resourceId';
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
    .setTypes([
      new FieldString().setRequired(true).setExample('workspace.innerField.secondInnerField'),
      new FieldUndefined(),
    ])
    .setDescription('Invalid field failing validation when error is ValidationError'),
});

const responseWithErrorRaw = {
  errors: new FieldOrCombination()
    .setTypes([new FieldArray().setType(errorObject), new FieldUndefined()])
    .setRequired(false)
    .setDescription('Endpoint call response errors'),
};

const defaultResponse = new FieldObject<IBaseEndpointResult>()
  .setName('EndpointResult')
  .setFields(responseWithErrorRaw)
  .setRequired(true)
  .setDescription('Endpoint result');

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

export const fReusables = {
  agent,
  date,
  id,
  agentOrUndefined: orUndefined(agent),
  dateOrUndefined: orUndefined(date),
  idOrUndefined: orUndefined(id),
};
