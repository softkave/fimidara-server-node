import {JobStatus} from '../../definitions/job';
import {
  FieldObject,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
} from '../../mddoc/mddoc';
import clientLogsConstants from '../clientLogs/constants';
import {
  MddocEndpointRequestHeaders_AuthRequired_ContentType,
  MddocEndpointResponseHeaders_ContentType_ContentLength,
  fReusables,
  mddocEndpointHttpHeaderItems,
} from '../endpoints.mddoc';
import {GetJobStatusEndpointParams, GetJobStatusEndpointResult} from './getJobStatus/types';

const jobStatus = FieldString.construct()
  .setDescription('Job status.')
  .setValid(Object.values(JobStatus))
  .setEnumName('JobStatus');

const getJobStatusParams = FieldObject.construct<GetJobStatusEndpointParams>()
  .setName('GetJobStatusEndpointParams')
  .setFields({
    workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
    jobId: FieldObject.requiredField(fReusables.jobId),
  })
  .setRequired(true);

const getJobStatusResponseBody = FieldObject.construct<GetJobStatusEndpointResult>()
  .setName('GetJobStatusEndpointResult')
  .setFields({
    status: FieldObject.requiredField(jobStatus),
  })
  .setRequired(true)
  .setDescription('Get job status endpoint success result.');

export const getJobStatusEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetJobStatusEndpointParams;
  requestHeaders: MddocEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetJobStatusEndpointResult;
  responseHeaders: MddocEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(clientLogsConstants.routes.ingestLogs)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getJobStatusParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getJobStatusResponseBody)
  .setName('GetJobStatusEndpoint');
