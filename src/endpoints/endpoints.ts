import {customAlphabet} from 'nanoid';
import {
  AppResourceType,
  IAgent,
  resourceTypeShortNames,
  validAgentTypes,
} from '../definitions/system';
import {
  FieldArray,
  FieldObject,
  FieldOrCombination,
  FieldString,
  FieldUndefined,
  HttpEndpointHeaderItem,
  orUndefined,
} from '../mddoc/mddoc';
import {idSeparator} from '../utils/resourceId';

const authorizationHeaderItem = new HttpEndpointHeaderItem(
  'Authorization',
  new FieldString(true, 'Access token', 'Bearer <token>'),
  true,
  'User, client, or program access token'
);

const requestContentTypeHeaderItem = new HttpEndpointHeaderItem(
  'Content-Type',
  new FieldString(
    true,
    'HTTP request content type',
    'application/json or multipart/form-data'
  ),
  true,
  'HTTP request content type'
);

const jsonRequestContentTypeHeaderItem = new HttpEndpointHeaderItem(
  'Content-Type',
  new FieldString(true, 'HTTP JSON request content type', 'application/json', [
    'application/json',
  ]),
  true,
  'HTTP JSON request content type'
);

const multipartFormdataRequestContentTypeHeaderItem =
  new HttpEndpointHeaderItem(
    'Content-Type',
    new FieldString(
      true,
      'HTTP multipart form-data request content type',
      'multipart/form-data',
      ['multipart/form-data']
    ),
    true,
    'HTTP multipart form-data request content type'
  );

const jsonResponseContentTypeHeaderItem = new HttpEndpointHeaderItem(
  'Content-Type',
  new FieldString(true, 'HTTP JSON response content type', undefined, [
    'application/json',
  ]),
  true,
  'HTTP JSON response content type'
);

const binaryResponseContentTypeHeaderItem = new HttpEndpointHeaderItem(
  'Content-Type',
  new FieldString(
    true,
    'HTTP binary stream response content type',
    'File content type like image/png or application/octet-stream'
  ),
  true,
  'HTTP binary stream response content type'
);

const responseContentTypeHeaderItem = new HttpEndpointHeaderItem(
  'Content-Type',
  new FieldString(
    true,
    'HTTP response content type',
    'application/json or application/octet-stream'
  ),
  true,
  'HTTP response content type'
);

export const httpHeaderItems = {
  authorizationHeaderItem,
  requestContentTypeHeaderItem,
  responseContentTypeHeaderItem,
  jsonResponseContentTypeHeaderItem,
  binaryResponseContentTypeHeaderItem,
  jsonRequestContentTypeHeaderItem,
  multipartFormdataRequestContentTypeHeaderItem,
};

const errorObject = new FieldObject('OperationError', {
  name: new FieldString(true, 'Error name', 'ValidationError'),
  message: new FieldString(true, 'Error message', 'Workspace name is invalid'),
  field: new FieldOrCombination(
    [
      new FieldString(true, undefined, 'workspace.innerField.secondInnerField'),
      new FieldUndefined(),
    ],
    false,
    'Invalid field failing validation when error is ValidationError'
  ),
});

const responseWithErrorRaw = {
  errors: new FieldOrCombination(
    [new FieldArray(errorObject), new FieldUndefined()],
    false,
    'Endpoint call response errors'
  ),
};

export const httpResponseItems = {
  responseWithErrorRaw,
};

const agent = new FieldObject<IAgent>('Agent', {
  agentId: new FieldString(true, 'Agent ID'),
  agentType: new FieldString(
    /** required */ true,
    'Agent type',
    AppResourceType.ProgramAccessToken,
    validAgentTypes
  ),
});

const date = new FieldString(false, 'Date string');
const id = new FieldString(
  false,
  'Resource ID',
  `${
    resourceTypeShortNames[AppResourceType.Workspace]
  }${idSeparator}${customAlphabet('0')()}`
);

export const fReusables = {
  agent,
  agentOrUndefined: orUndefined(agent),
  date,
  dateOrUndefined: orUndefined(date),
  id,
  idOrUndefined: orUndefined(id),
};
