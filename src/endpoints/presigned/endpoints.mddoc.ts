import assert from 'assert';
import {FileMatcher} from '../../definitions/file.js';
import {
  FieldObjectFieldsMap,
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc.js';
import {multilineTextToParagraph} from '../../utils/fns.js';
import {kEndpointConstants} from '../constants.js';
import {fReusables, mddocEndpointHttpHeaderItems} from '../endpoints.mddoc.js';
import {kPresignedPathsConstants} from './constants.js';
import {
  GetPresignedPathsForFilesEndpointParams,
  GetPresignedPathsForFilesEndpointResult,
  GetPresignedPathsForFilesItem,
} from './getPresignedPaths/types.js';
import {
  IssuePresignedPathEndpointParams,
  IssuePresignedPathEndpointResult,
} from './issuePresignedPath/types.js';
import {
  GetPresignedPathsForFilesHttpEndpoint,
  IssuePresignedPathHttpEndpoint,
} from './types.js';

const fileMatcherParts: FieldObjectFieldsMap<FileMatcher> = {
  filepath: mddocConstruct.constructFieldObjectField(false, fReusables.filepath),
  fileId: mddocConstruct.constructFieldObjectField(false, fReusables.fileId),
};

const fileMatcher = mddocConstruct
  .constructFieldObject<FileMatcher>()
  .setName('FileMatcher')
  .setFields({...fileMatcherParts});

const presignedPath = mddocConstruct
  .constructFieldString()
  .setDescription(
    'String path that only works with readFile endpoint. Can be used in place of filepath'
  );

const issuePresignedPathParams = mddocConstruct
  .constructFieldObject<IssuePresignedPathEndpointParams>()
  .setName('IssuePresignedPathEndpointParams')
  .setFields({
    ...fileMatcherParts,
    action: mddocConstruct.constructFieldObjectField(false, fReusables.actionOrList),
    duration: mddocConstruct.constructFieldObjectField(false, fReusables.duration),
    expires: mddocConstruct.constructFieldObjectField(false, fReusables.expires),
    usageCount: mddocConstruct.constructFieldObjectField(
      false,
      mddocConstruct
        .constructFieldNumber()
        .setDescription('How many uses the generated path is valid for')
    ),
  });
const issuePresignedPathResponseBody = mddocConstruct
  .constructFieldObject<IssuePresignedPathEndpointResult>()
  .setName('IssuePresignedPathEndpointResult')
  .setFields({
    path: mddocConstruct.constructFieldObjectField(true, presignedPath),
  });

const getPresignedPathsForFilesParams = mddocConstruct
  .constructFieldObject<GetPresignedPathsForFilesEndpointParams>()
  .setName('GetPresignedPathsForFilesEndpointParams')
  .setFields({
    files: mddocConstruct.constructFieldObjectField(
      false,
      mddocConstruct
        .constructFieldArray<FileMatcher>()
        .setType(fileMatcher)
        .setMax(kEndpointConstants.inputListMax)
    ),
    workspaceId: mddocConstruct.constructFieldObjectField(false, fReusables.workspaceId),
  });
const getPresignedPathsForFilesResponseBody = mddocConstruct
  .constructFieldObject<GetPresignedPathsForFilesEndpointResult>()
  .setName('GetPresignedPathsForFilesEndpointResult')
  .setFields({
    paths: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<GetPresignedPathsForFilesItem>().setType(
        mddocConstruct
          .constructFieldObject<GetPresignedPathsForFilesItem>()
          .setName('GetPresignedPathsForFilesItem')
          .setFields({
            path: mddocConstruct.constructFieldObjectField(true, presignedPath),
            filepath: mddocConstruct.constructFieldObjectField(true, fReusables.filepath),
          })
      )
    ),
  });

const uploadMultipartWithAuthOptionalHeaderFields =
  mddocEndpointHttpHeaderItems.requestHeaders_AuthOptional_MultipartContentType.fields;
assert(uploadMultipartWithAuthOptionalHeaderFields);

export const issuePresignedPathEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      IssuePresignedPathHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      IssuePresignedPathHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<IssuePresignedPathHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      IssuePresignedPathHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      IssuePresignedPathHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      IssuePresignedPathHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kPresignedPathsConstants.routes.issuePresignedPath)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(issuePresignedPathParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(issuePresignedPathResponseBody)
  .setName('IssuePresignedPathEndpoint')
  .setDescription(
    multilineTextToParagraph(
      `Issues file presigned paths for reading private files without passing Authorization header, like in <img /> html tags.
      It's only supports reading files at the moment. Eventually, we'll support uploading files`
    )
  );

export const getPresignedPathsForFilesEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetPresignedPathsForFilesHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetPresignedPathsForFilesHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetPresignedPathsForFilesHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      GetPresignedPathsForFilesHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetPresignedPathsForFilesHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetPresignedPathsForFilesHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kPresignedPathsConstants.routes.getPresignedPaths)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getPresignedPathsForFilesParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getPresignedPathsForFilesResponseBody)
  .setName('GetPresignedPathsForFilesEndpoint')
  .setDescription(
    'Retrieves file presigned paths for reading private files without passing Authorization header, like in <img /> html tags'
  );
