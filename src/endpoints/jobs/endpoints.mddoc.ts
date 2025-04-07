import {kJobStatus} from '../../definitions/job.js';
import {
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc.js';
import {fReusables, mddocEndpointHttpHeaderItems} from '../endpoints.mddoc.js';
import {jobConstants} from './constants.js';
import {
  GetJobStatusEndpointParams,
  GetJobStatusEndpointResult,
} from './getJobStatus/types.js';
import {GetJobStatusHttpEndpoint} from './types.js';

const jobStatus = mddocConstruct
  .constructFieldString()
  .setDescription('Job status')
  .setValid(Object.values(kJobStatus))
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
    errorMessage: mddocConstruct.constructFieldObjectField(
      false,
      mddocConstruct.constructFieldString()
    ),
  });

export const getJobStatusEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetJobStatusHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetJobStatusHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetJobStatusHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      GetJobStatusHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetJobStatusHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetJobStatusHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(jobConstants.routes.getJobStatus)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getJobStatusParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(getJobStatusResponseBody)
  .setName('GetJobStatusEndpoint');
