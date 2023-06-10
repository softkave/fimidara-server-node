import {FileMatcher, PublicFile} from '../../definitions/file';
import {
  FieldArray,
  FieldBinary,
  FieldBoolean,
  FieldNumber,
  FieldObject,
  FieldObjectFields,
  FieldOrCombination,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
  HttpEndpointMultipartFormdata,
} from '../../mddoc/mddoc';
import {endpointConstants} from '../constants';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc';
import {LongRunningJobResult} from '../jobs/types';
import {
  HttpEndpointRequestHeaders_AuthOptional,
  HttpEndpointRequestHeaders_AuthOptional_ContentType,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {fileConstants} from './constants';
import {DeleteFileEndpointParams} from './deleteFile/types';
import {GetFileDetailsEndpointParams, GetFileDetailsEndpointResult} from './getFileDetails/types';
import {
  GetFilePresignedPathsEndpointParams,
  GetFilePresignedPathsEndpointResult,
  GetFilePresignedPathsItem,
} from './getFilePresignedPaths/types';
import {
  IssueFilePresignedPathEndpointParams,
  IssueFilePresignedPathEndpointResult,
} from './issueFilePresignedPath/types';
import {
  ImageFormatEnumMap,
  ImageResizeFitEnumMap,
  ImageResizeParams,
  ImageResizePositionEnumMap,
  ReadFileEndpointHttpQuery,
  ReadFileEndpointParams,
} from './readFile/types';
import {FileMatcherPathParameters} from './types';
import {
  UpdateFileDetailsEndpointParams,
  UpdateFileDetailsEndpointResult,
  UpdateFileDetailsInput,
} from './updateFileDetails/types';
import {UploadFileEndpointParams, UploadFileEndpointResult} from './uploadFile/types';

const mimetype = FieldString.construct().setDescription('File MIME type');
const encoding = FieldString.construct().setDescription('File encoding');
const size = FieldNumber.construct().setDescription('File size in bytes');
const extension = FieldString.construct().setDescription('File extension');
const height = FieldString.construct().setDescription('Resize to height if file is an image.');
const width = FieldString.construct().setDescription('Resize to width if file is an image.');
const fit = FieldString.construct()
  .setDescription('How the image should be resized to fit provided dimensions.')
  .setEnumName('ImageResizeFitEnum')
  .setValid(Object.values(ImageResizeFitEnumMap));
const positionEnum = FieldString.construct()
  .setDescription('Gravity or strategy to use when fit is cover or contain.')
  .setEnumName('ImageResizePositionEnum')
  .setValid(Object.values(ImageResizePositionEnumMap));
const positionNum = FieldNumber.construct().setDescription(
  'Position to use when fit is cover or contain.'
);
const position = FieldOrCombination.construct().setTypes([positionEnum, positionNum]);
const background = FieldString.construct()
  .setDescription('Hex background color to use when fit is contain.')
  .setExample('#FFFFFF');
const withoutEnlargement = FieldBoolean.construct().setDescription(
  'Do not enlarge if the width or height are already less than provided dimensions.'
);
const format = FieldString.construct()
  .setDescription('Format to transform image to if file is an image.')
  .setEnumName('ImageFormatEnum')
  .setValid(Object.values(ImageFormatEnumMap));

const file = FieldObject.construct<PublicFile>()
  .setName('File')
  .setFields({
    size: FieldObject.requiredField(size),
    extension: FieldObject.optionalField(extension),
    resourceId: FieldObject.requiredField(fReusables.id),
    workspaceId: FieldObject.requiredField(fReusables.workspaceId),
    parentId: FieldObject.requiredField(fReusables.folderIdOrNull),
    idPath: FieldObject.requiredField(fReusables.idPath),
    namePath: FieldObject.requiredField(fReusables.folderNamePath),
    mimetype: FieldObject.optionalField(mimetype),
    encoding: FieldObject.optionalField(encoding),
    createdBy: FieldObject.requiredField(fReusables.agent),
    createdAt: FieldObject.requiredField(fReusables.date),
    lastUpdatedBy: FieldObject.requiredField(fReusables.agent),
    lastUpdatedAt: FieldObject.requiredField(fReusables.date),
    name: FieldObject.requiredField(fReusables.filename),
    description: FieldObject.optionalField(fReusables.description),
    providedResourceId: FieldObject.optionalField(fReusables.providedResourceId),
  });

const updateFileDetailsInput = FieldObject.construct<UpdateFileDetailsInput>()
  .setName('UpdateFileDetailsInput')
  .setFields({
    description: FieldObject.optionalField(fReusables.description),
    mimetype: FieldObject.optionalField(mimetype),
  });

const fileMatcherParts: FieldObjectFields<FileMatcher> = {
  filepath: FieldObject.optionalField(fReusables.filepath),
  fileId: FieldObject.optionalField(fReusables.fileId),
};

const fileMatcherPathParameters = FieldObject.construct<FileMatcherPathParameters>().setFields({
  filepath: FieldObject.optionalField(fReusables.filepath),
});

const fileMatcher = FieldObject.construct<FileMatcher>()
  .setName('FileMatcher')
  .setFields({
    ...fileMatcherParts,
  });

const filePresignedPath = FieldString.construct().setDescription(
  'String path that only works with readFile endpoint. Can be used in place of filepath.'
);

const updateFileDetailsParams = FieldObject.construct<UpdateFileDetailsEndpointParams>()
  .setName('UpdateFileDetailsEndpointParams')
  .setFields({
    file: FieldObject.requiredField(updateFileDetailsInput),
    ...fileMatcherParts,
  })
  .setRequired(true)
  .setDescription('Update file details endpoint params.');
const updateFileDetailsResponseBody = FieldObject.construct<UpdateFileDetailsEndpointResult>()
  .setName('UpdateFileDetailsEndpointResult')
  .setFields({file: FieldObject.requiredField(file)})
  .setRequired(true)
  .setDescription('Update file details endpoint success result.');

const issueFilePresignedPathParams = FieldObject.construct<IssueFilePresignedPathEndpointParams>()
  .setName('IssueFilePresignedPathEndpointParams')
  .setFields({
    ...fileMatcherParts,
    duration: FieldObject.optionalField(fReusables.duration),
    expires: FieldObject.optionalField(fReusables.expires),
    usageCount: FieldObject.optionalField(
      FieldNumber.construct().setDescription('How many uses the generated path is valid for.')
    ),
  })
  .setRequired(true)
  .setDescription('Issue file presigned path endpoint params.');
const issueFilePresignedPathResponseBody =
  FieldObject.construct<IssueFilePresignedPathEndpointResult>()
    .setName('IssueFilePresignedPathEndpointResult')
    .setFields({
      path: FieldObject.requiredField(filePresignedPath),
    })
    .setRequired(true)
    .setDescription('Issue file presigned path endpoint success result.');

const getFilePresignedPathsParams = FieldObject.construct<GetFilePresignedPathsEndpointParams>()
  .setName('GetFilePresignedPathsEndpointParams')
  .setFields({
    files: FieldObject.optionalField(
      FieldArray.construct().setType(fileMatcher).setMax(endpointConstants.inputListMax)
    ),
    workspaceId: FieldObject.optionalField(fReusables.workspaceId),
  })
  .setRequired(true)
  .setDescription('Get file presigned paths endpoint params.');
const getFilePresignedPathsResponseBody =
  FieldObject.construct<GetFilePresignedPathsEndpointResult>()
    .setName('GetFilePresignedPathsEndpointResult')
    .setFields({
      paths: FieldObject.requiredField(
        FieldArray.construct<GetFilePresignedPathsItem>().setType(
          FieldObject.construct<GetFilePresignedPathsItem>()
            .setName('GetFilePresignedPathsItem')
            .setFields({
              path: FieldObject.requiredField(filePresignedPath),
              filepath: FieldObject.requiredField(fReusables.filepath),
            })
        )
      ),
    })
    .setRequired(true)
    .setDescription('Get file presigned paths endpoint success result.');

const getFileDetailsParams = FieldObject.construct<GetFileDetailsEndpointParams>()
  .setName('GetFileDetailsEndpointParams')
  .setFields(fileMatcherParts)
  .setRequired(true)
  .setDescription('Get file details endpoint params.');
const getFileDetailsResponseBody = FieldObject.construct<GetFileDetailsEndpointResult>()
  .setName('GetFileDetailsEndpointResult')
  .setFields({file: FieldObject.requiredField(file)})
  .setRequired(true)
  .setDescription('Get file details endpoint success result.');

const deleteFileParams = FieldObject.construct<DeleteFileEndpointParams>()
  .setName('DeleteFileEndpointParams')
  .setFields(fileMatcherParts)
  .setRequired(true)
  .setDescription('Delete file endpoint params.');

const readFileParams = FieldObject.construct<ReadFileEndpointParams>()
  .setName('ReadFileEndpointParams')
  .setFields({
    ...fileMatcherParts,
    imageResize: FieldObject.optionalField(
      FieldObject.construct<ImageResizeParams>()
        .setFields({
          width: FieldObject.optionalField(width),
          height: FieldObject.optionalField(height),
          fit: FieldObject.optionalField(fit),
          position: FieldObject.optionalField(position),
          background: FieldObject.optionalField(background),
          withoutEnlargement: FieldObject.optionalField(withoutEnlargement),
        })
        .setName('ImageResizeParams')
    ),
    imageFormat: FieldObject.optionalField(format),
  })
  .setRequired(true)
  .setDescription('Get file endpoint params.');
const readFileQuery = FieldObject.construct<ReadFileEndpointHttpQuery>().setFields({
  w: FieldObject.optionalField(width),
  h: FieldObject.optionalField(height),
  pos: FieldObject.optionalField(position),
  fit: FieldObject.optionalField(fit),
  bg: FieldObject.optionalField(background),
  wEnlargement: FieldObject.optionalField(withoutEnlargement),
  format: FieldObject.optionalField(format),
});
const readFileResponseHeaders =
  FieldObject.construct<HttpEndpointResponseHeaders_ContentType_ContentLength>().setFields({
    'Content-Type': FieldObject.requiredField(
      FieldString.construct()
        .setRequired(true)
        .setDescription(
          'Get file endpoint result content type. ' +
            "If request is successful, it will be the file's content type " +
            'if it is known or application/octet-stream otherwise, ' +
            'and application/json containing errors if request fails.'
        )
    ),
    'Content-Length': FieldObject.requiredField(
      mddocEndpointHttpHeaderItems.responseHeaderItem_ContentLength
    ),
  });
const readFileResponseBody = FieldBinary.construct();

const updloadFileParams =
  HttpEndpointMultipartFormdata.construct<UploadFileEndpointParams>().setItems(
    FieldObject.construct<UploadFileEndpointParams>()
      .setFields({
        ...fileMatcherParts,
        data: FieldObject.requiredField(
          FieldBinary.construct()
            .setRequired(true)
            .setDescription('File binary.')
            .setMax(fileConstants.maxFileSizeInBytes)
        ),
        description: FieldObject.optionalField(fReusables.description),
        mimetype: FieldObject.optionalField(mimetype),
        encoding: FieldObject.optionalField(encoding),
        extension: FieldObject.optionalField(extension),
      })
      .setDescription('Upload file endpoint params.')
      .setName('UploadFileEndpointParams')
  );
const uploadFileResponseBody = FieldObject.construct<UploadFileEndpointResult>()
  .setName('UploadFileEndpointResult')
  .setFields({file: FieldObject.requiredField(file)})
  .setRequired(true)
  .setDescription('Upload file endpoint success result.');

export const readFilePOSTEndpointDefinition = HttpEndpointDefinition.construct<{
  pathParameters: FileMatcherPathParameters;
  query: ReadFileEndpointHttpQuery;
  requestBody: ReadFileEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthOptional_ContentType;
  responseBody: FieldBinary;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(fileConstants.routes.readFile)
  .setPathParamaters(fileMatcherPathParameters)
  .setMethod(HttpEndpointMethod.Post)
  .setQuery(readFileQuery)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthOptional_JsonContentType)
  .setRequestBody(readFileParams)
  .setResponseHeaders(readFileResponseHeaders)
  .setResponseBody(readFileResponseBody)
  .setName('ReadFileEndpoint')
  .setDescription('Read file endpoint.');
export const readFileGETEndpointDefinition = HttpEndpointDefinition.construct<{
  pathParameters: FileMatcherPathParameters;
  query: ReadFileEndpointHttpQuery;
  requestHeaders: HttpEndpointRequestHeaders_AuthOptional;
  requestBody: undefined;
  responseBody: FieldBinary;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(fileConstants.routes.readFile)
  .setPathParamaters(fileMatcherPathParameters)
  .setMethod(HttpEndpointMethod.Get)
  .setQuery(readFileQuery)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthOptional)
  .setResponseHeaders(readFileResponseHeaders)
  .setResponseBody(readFileResponseBody)
  .setName('ReadFileEndpoint')
  .setDescription('Read file endpoint.');

export const uploadFileEndpointDefinition = HttpEndpointDefinition.construct<{
  pathParameters: FileMatcherPathParameters;
  requestBody: UploadFileEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthOptional_ContentType;
  responseBody: UploadFileEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(fileConstants.routes.uploadFile)
  .setPathParamaters(fileMatcherPathParameters)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updloadFileParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthOptional_MultipartContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(uploadFileResponseBody)
  .setName('UploadFileEndpoint')
  .setDescription('Upload file endpoint.');

export const getFileDetailsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetFileDetailsEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetFileDetailsEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(fileConstants.routes.getFileDetails)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getFileDetailsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getFileDetailsResponseBody)
  .setName('GetFileDetailsEndpoint')
  .setDescription('Get file details endpoint.');

export const updateFileDetailsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: UpdateFileDetailsEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: UpdateFileDetailsEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(fileConstants.routes.updateFileDetails)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateFileDetailsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(updateFileDetailsResponseBody)
  .setName('UpdateFileDetailsEndpoint')
  .setDescription('Update file details endpoint.');

export const deleteFileEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: DeleteFileEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: LongRunningJobResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(fileConstants.routes.deleteFile)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deleteFileParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeleteFileEndpoint')
  .setDescription('Delete file endpoint.');

export const issueFilePresignedPathEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: IssueFilePresignedPathEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: IssueFilePresignedPathEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(fileConstants.routes.issueFilePresignedPath)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(issueFilePresignedPathParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(issueFilePresignedPathResponseBody)
  .setName('IssueFilePresignedPathEndpoint')
  .setDescription(
    'Issues file presigned paths for reading private files without passing Authorization header, like in <img /> html tags.'
  );

export const getFilePresignedPathsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetFilePresignedPathsEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetFilePresignedPathsEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(fileConstants.routes.getFilePresignedPaths)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getFilePresignedPathsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getFilePresignedPathsResponseBody)
  .setName('GetFilePresignedPathsEndpoint')
  .setDescription(
    'Retrieves file presigned paths for reading private files without passing Authorization header, like in <img /> html tags.'
  );

export const fileEndpointsParts = {file};
