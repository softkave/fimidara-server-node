import {IFileMatcher, IPublicFile} from '../../definitions/file';
import {
  asFieldObjectAny,
  FieldBinary,
  FieldObject,
  FieldObjectFields,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointHeaderItem,
  HttpEndpointHeaders,
  HttpEndpointMethod,
  HttpEndpointMultipartFormdata,
  HttpEndpointParameterPathnameItem,
  HttpEndpointResponse,
  orUndefined,
} from '../../mddoc/mddoc';
import {endpointHttpHeaderItems, endpointHttpResponseItems, endpointStatusCodes, fReusables} from '../endpoints';
import {IDeleteFileEndpointParams} from './deleteFile/types';
import {IGetFileEndpointParams, IImageTransformationParams} from './getFile/types';
import {IGetFileDetailsEndpointParams, IGetFileDetailsEndpointResult} from './getFileDetails/types';
import {IGetFileEndpointQueryParams} from './setupRESTEndpoints';
import {
  IUpdateFileDetailsEndpointParams,
  IUpdateFileDetailsEndpointResult,
  IUpdateFileDetailsInput,
} from './updateFileDetails/types';
import {IUploadFileEndpointParams, IUploadFileEndpointResult, UploadFilePublicAccessActions} from './uploadFile/types';

const mimetype = new FieldString().setDescription('File MIME type');
const encoding = new FieldString().setDescription('File encoding');
const size = new FieldString().setDescription('File size in bytes');
const extension = new FieldString().setDescription('File extension');
const uploadFilePublicAccessAction = new FieldString()
  .setDescription('Public access actions allowed on a file')
  .setValid(Object.values(UploadFilePublicAccessActions));
const height = new FieldString().setDescription('Resize to height if file is an image.');
const width = new FieldString().setDescription('Resize to width if file is an image.');
const mimetypeOrUndefined = orUndefined(mimetype);
const encodingOrUndefined = orUndefined(encoding);
const extensionOrUndefined = orUndefined(extension);
const uploadFilePublicAccessActionOrUndefined = orUndefined(uploadFilePublicAccessAction);
const widthOrUndefined = orUndefined(width);
const heightOrUndefined = orUndefined(height);

const file = new FieldObject<IPublicFile>().setName('File').setFields({
  size,
  extension,
  resourceId: fReusables.id,
  workspaceId: fReusables.workspaceId,
  folderId: fReusables.folderIdOrUndefined,
  idPath: fReusables.idPath,
  namePath: fReusables.folderNamePath,
  mimetype: mimetypeOrUndefined,
  encoding: encodingOrUndefined,
  createdBy: fReusables.agent,
  createdAt: fReusables.date,
  lastUpdatedBy: fReusables.agent,
  lastUpdatedAt: fReusables.date,
  name: fReusables.filename,
  description: fReusables.descriptionOrUndefined,
});

const updateFileDetailsInput = new FieldObject<IUpdateFileDetailsInput>().setName('UpdateFileDetailsInput').setFields({
  description: fReusables.descriptionOrUndefined,
  mimetype: mimetypeOrUndefined,
  publicAccessAction: uploadFilePublicAccessActionOrUndefined,
});

const fileMatcherParts: FieldObjectFields<IFileMatcher> = {
  filepath: fReusables.filepathOrUndefined,
  fileId: fReusables.fileIdOrUndefined,
};

const filepathParameterPathname = new HttpEndpointParameterPathnameItem()
  .setName('filepath')
  .setType(
    new FieldString()
      .setDescription('File path. You can pass the filepath either in the URL or in the request body.')
      .setExample('/my-folder/my-file.png')
  );

const updateFileDetailsParams = new FieldObject<IUpdateFileDetailsEndpointParams>()
  .setName('UpdateFileDetailsEndpointParams')
  .setFields({
    file: updateFileDetailsInput,
    ...fileMatcherParts,
  })
  .setRequired(true)
  .setDescription('Update file details endpoint params.');
const updateFileDetailsResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IUpdateFileDetailsEndpointResult>()
        .setName('UpdateFileDetailsEndpointSuccessResult')
        .setFields({file})
        .setRequired(true)
        .setDescription('Update file details endpoint success result.')
    ),
];

const getFileDetailsParams = new FieldObject<IGetFileDetailsEndpointParams>()
  .setName('GetFileDetailsEndpoint')
  .setFields(fileMatcherParts)
  .setRequired(true)
  .setDescription('Get file details endpoint params.');
const getFileDetailsResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IGetFileDetailsEndpointResult>()
        .setName('GetFileDetailsEndpointSuccessResult')
        .setFields({file})
        .setRequired(true)
        .setDescription('Get file details endpoint success result.')
    ),
];

const deleteFileParams = new FieldObject<IDeleteFileEndpointParams>()
  .setName('RevokeFileEndpointParams')
  .setFields(fileMatcherParts)
  .setRequired(true)
  .setDescription('Delete file endpoint params.');

const getFileParams = new FieldObject<IGetFileEndpointParams>()
  .setName('GetFileEndpointParams')
  .setFields({
    ...fileMatcherParts,
    imageTranformation: new FieldObject<IImageTransformationParams>()
      .setFields({
        width: widthOrUndefined,
        height: heightOrUndefined,
      })
      .setName('ImageTransformationParams'),
  })
  .setRequired(true)
  .setDescription('Get file endpoint params.');
const getFileResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(
      new HttpEndpointHeaders().setItems([
        new HttpEndpointHeaderItem()
          .setName('Content-Type')
          .setType(
            new FieldString()
              .setRequired(true)
              .setDescription(
                'Get file endpoint result content type. ' +
                  "If request is successful, it will be the file's content type " +
                  'if it is known or application/octet-stream otherwise, ' +
                  'and application/json containing errors if request fails.'
              )
          )
          .setRequired(true)
          .setDescription('Response content type.'),
        endpointHttpHeaderItems.responseContentLengthHeaderItem,
      ])
    )
    .setResponseBody(new FieldBinary()),
];

const updloadFileParams = new HttpEndpointMultipartFormdata().setItems(
  asFieldObjectAny(
    new FieldObject<IUploadFileEndpointParams>().setFields({
      ...fileMatcherParts,
      data: new FieldBinary().setRequired(true).setDescription('File binary.'),
      description: fReusables.descriptionOrUndefined,
      mimetype: mimetypeOrUndefined,
      publicAccessAction: uploadFilePublicAccessActionOrUndefined,
      encoding: encodingOrUndefined,
      extension: extensionOrUndefined,
    })
  )
    .setDescription('Upload file endpoint params.')
    .setName('UploadFileEndpointParams')
);
const uploadFileResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IUploadFileEndpointResult>()
        .setName('UploadFileEndpointSuccessResult')
        .setFields({file})
        .setRequired(true)
        .setDescription('Upload file endpoint success result.')
    ),
];

export const getFileEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/files/getFile')
  .setParameterPathnames([filepathParameterPathname])
  .setMethod(HttpEndpointMethod.Post)
  .setQuery(
    asFieldObjectAny(
      new FieldObject<IGetFileEndpointQueryParams>().setFields({
        w: widthOrUndefined,
        h: heightOrUndefined,
      })
    )
  )
  .setRequestBody(asFieldObjectAny(getFileParams))
  .setResponses(getFileResult);

export const uploadFileEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/files/uploadFile')
  .setParameterPathnames([filepathParameterPathname])
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updloadFileParams)
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(uploadFileResult);

export const getFileDetailsEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/files/getFileDetails')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getFileDetailsParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getFileDetailsResult);

export const updateFileDetailsEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/files/updateFileDetails')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(updateFileDetailsParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(updateFileDetailsResult);

export const deleteFileEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/files/deleteFile')
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(asFieldObjectAny(deleteFileParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(endpointHttpResponseItems.emptyEndpointResponse);

export const fileEndpointsParts = {file};
