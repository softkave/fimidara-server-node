import {FileMatcher, PublicFile} from '../../definitions/file';
import {
  FieldBinary,
  FieldNumber,
  FieldObject,
  FieldObjectFields,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
  HttpEndpointMultipartFormdata,
} from '../../mddoc/mddoc';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc';
import {LongRunningJobResult} from '../jobs/types';
import {
  HttpEndpointRequestHeaders_AuthOptional_ContentType,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {fileConstants} from './constants';
import {DeleteFileEndpointParams} from './deleteFile/types';
import {GetFileDetailsEndpointParams, GetFileDetailsEndpointResult} from './getFileDetails/types';
import {
  ImageTransformationParams,
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

const file = FieldObject.construct<PublicFile>()
  .setName('File')
  .setFields({
    size: FieldObject.requiredField(size),
    extension: FieldObject.requiredField(extension),
    resourceId: FieldObject.requiredField(fReusables.id),
    workspaceId: FieldObject.requiredField(fReusables.workspaceId),
    parentId: FieldObject.requiredField(fReusables.folderId),
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

const updateFileDetailsParams = FieldObject.construct<UpdateFileDetailsEndpointParams>()
  .setName('UpdateFileDetailsEndpointParams')
  .setFields({
    file: FieldObject.requiredField(updateFileDetailsInput),
    ...fileMatcherParts,
  })
  .setRequired(true)
  .setDescription('Update file details endpoint params.');
const updateFileDetailsResponseBody = FieldObject.construct<UpdateFileDetailsEndpointResult>()
  .setName('UpdateFileDetailsEndpointSuccessResult')
  .setFields({file: FieldObject.requiredField(file)})
  .setRequired(true)
  .setDescription('Update file details endpoint success result.');

const getFileDetailsParams = FieldObject.construct<GetFileDetailsEndpointParams>()
  .setName('GetFileDetailsEndpoint')
  .setFields(fileMatcherParts)
  .setRequired(true)
  .setDescription('Get file details endpoint params.');
const getFileDetailsResponseBody = FieldObject.construct<GetFileDetailsEndpointResult>()
  .setName('GetFileDetailsEndpointSuccessResult')
  .setFields({file: FieldObject.requiredField(file)})
  .setRequired(true)
  .setDescription('Get file details endpoint success result.');

const deleteFileParams = FieldObject.construct<DeleteFileEndpointParams>()
  .setName('RevokeFileEndpointParams')
  .setFields(fileMatcherParts)
  .setRequired(true)
  .setDescription('Delete file endpoint params.');

const readFileParams = FieldObject.construct<ReadFileEndpointParams>()
  .setName('GetFileEndpointParams')
  .setFields({
    ...fileMatcherParts,
    imageTranformation: FieldObject.optionalField(
      FieldObject.construct<ImageTransformationParams>()
        .setFields({
          width: FieldObject.optionalField(width),
          height: FieldObject.optionalField(height),
        })
        .setName('ImageTransformationParams')
    ),
  })
  .setRequired(true)
  .setDescription('Get file endpoint params.');
const readFileQuery = FieldObject.construct<ReadFileEndpointHttpQuery>().setFields({
  w: FieldObject.optionalField(width),
  h: FieldObject.optionalField(height),
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
  .setName('UploadFileEndpointSuccessResult')
  .setFields({file: FieldObject.requiredField(file)})
  .setRequired(true)
  .setDescription('Upload file endpoint success result.');

export const readFileEndpointDefinition = HttpEndpointDefinition.construct<{
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
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthOptional_JsonContentType)
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

export const fileEndpointsParts = {file};
