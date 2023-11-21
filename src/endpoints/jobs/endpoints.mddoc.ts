import {JobStatusMap} from '../../definitions/job';
import {
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc';
import {fReusables, mddocEndpointHttpHeaderItems} from '../endpoints.mddoc';
import {jobConstants} from './constants';
import {
  GetJobStatusEndpointParams,
  GetJobStatusEndpointResult,
} from './getJobStatus/types';
import {GetJobStatusHttpEndpoint} from './types';

const jobStatus = mddocConstruct
  .constructFieldString()
  .setDescription('Job status.')
  .setValid(Object.values(JobStatusMap))
  .setEnumName('JobStatus');

const getJobStatusParams = mddocConstruct
  .constructFieldObject<GetJobStatusEndpointParams>()
  .setName('GetJobStatusEndpointParams')
  .setFields({
    jobId: mddocConstruct.constructFieldObjectField(true, fReusables.jobId),
  });

const getJobStatusResponseBody = mddocConstruct
  .constructFieldObject<GetJobStatusEndpointResult>()
  .setName('GetJobStatusEndpointResult')
  .setFields({
    status: mddocConstruct.constructFieldObjectField(true, jobStatus),
  })
  .setDescription('Get job status endpoint success result.');

export const getJobStatusEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetJobStatusHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetJobStatusHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<GetJobStatusHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      GetJobStatusHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetJobStatusHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<GetJobStatusHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(jobConstants.routes.getJobStatus)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getJobStatusParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getJobStatusResponseBody)
  .setName('GetJobStatusEndpoint');
