import {IFileMatcher, IPublicFile} from '../../definitions/file';
import {ExcludeTags} from '../../definitions/tag';
import {
  FieldBinary,
  FieldObject,
  FieldObjectFields,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointHeaderItem,
  HttpEndpointHeaders,
  HttpEndpointMethod,
  HttpEndpointMultipartFormdata,
  HttpEndpointPathParameterItem,
  HttpEndpointResponse,
  asFieldObjectAny,
  cloneAndMarkNotRequired,
  orUndefined,
} from '../../mddoc/mddoc';
import {
  endpointHttpResponseItems,
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointStatusCodes,
} from '../endpoints.mddoc';
import {fileConstants} from './constants';
import {IDeleteFileEndpointParams} from './deleteFile/types';
import {IGetFileDetailsEndpointParams, IGetFileDetailsEndpointResult} from './getFileDetails/types';
import {IImageTransformationParams, IReadFileEndpointParams} from './readFile/types';
import {IReadFileEndpointQueryParams} from './setupRESTEndpoints';
import {
  IUpdateFileDetailsEndpointParams,
  IUpdateFileDetailsEndpointResult,
  IUpdateFileDetailsInput,
} from './updateFileDetails/types';
import {
  IUploadFileEndpointParams,
  IUploadFileEndpointResult,
  UploadFilePublicAccessActions,
} from './uploadFile/types';

const mimetype = new FieldString().setDescription('File MIME type');
const encoding = new FieldString().setDescription('File encoding');
const size = new FieldString().setDescription('File size in bytes');
const extension = new FieldString().setDescription('File extension');
const uploadFilePublicAccessAction = new FieldString()
  .setDescription('Public access actions allowed on a file')
  .setValid(Object.values(UploadFilePublicAccessActions))
  .setEnumName('UploadFilePublicAccessActions');
const height = new FieldString().setDescription('Resize to height if file is an image.');
const width = new FieldString().setDescription('Resize to width if file is an image.');
const mimetypeOrUndefined = orUndefined(mimetype);
const encodingOrUndefined = orUndefined(encoding);
const mimetypeNotRequired = cloneAndMarkNotRequired(mimetype);
const encodingNotRequired = cloneAndMarkNotRequired(encoding);
const extensionNotRequired = cloneAndMarkNotRequired(extension);
const uploadFilePublicAccessActionNotRequired = cloneAndMarkNotRequired(
  uploadFilePublicAccessAction
);
const widthNotRequired = cloneAndMarkNotRequired(width);
const heightNotRequired = cloneAndMarkNotRequired(height);

const file = new FieldObject<IPublicFile>().setName('File').setFields({
  size,
  extension,
  resourceId: fReusables.id,
  workspaceId: fReusables.workspaceId,
  parentId: fReusables.folderIdOrUndefined,
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
  providedResourceId: fReusables.providedResourceIdOrUndefined,
});

const updateFileDetailsInput = new FieldObject<ExcludeTags<IUpdateFileDetailsInput>>()
  .setName('UpdateFileDetailsInput')
  .setFields({
    description: fReusables.descriptionNotRequired,
    mimetype: mimetypeNotRequired,
    // publicAccessAction: uploadFilePublicAccessActionNotRequired,
  });

const fileMatcherParts: FieldObjectFields<IFileMatcher> = {
  filepath: fReusables.filepathNotRequired,
  fileId: fReusables.fileIdNotRequired,
};

const filepathParameterPathname = new HttpEndpointPathParameterItem()
  .setName('filepath')
  .setType(
    new FieldString()
      .setDescription(
        'File path. You can pass the filepath either in the URL or in the request body.'
      )
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
    .setStatusCode(mddocEndpointStatusCodes.success)
    .setResponseHeaders(mddocEndpointHttpHeaderItems.jsonResponseHeaders)
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
    .setStatusCode(mddocEndpointStatusCodes.success)
    .setResponseHeaders(mddocEndpointHttpHeaderItems.jsonResponseHeaders)
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

const readFileParams = new FieldObject<IReadFileEndpointParams>()
  .setName('GetFileEndpointParams')
  .setFields({
    ...fileMatcherParts,
    imageTranformation: new FieldObject<IImageTransformationParams>()
      .setFields({
        width: widthNotRequired,
        height: heightNotRequired,
      })
      .setName('ImageTransformationParams'),
  })
  .setRequired(true)
  .setDescription('Get file endpoint params.');
const readFileResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(mddocEndpointStatusCodes.success)
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
        mddocEndpointHttpHeaderItems.responseContentLengthHeaderItem,
      ])
    )
    .setResponseBody(new FieldBinary()),
];

const updloadFileParams = new HttpEndpointMultipartFormdata().setItems(
  asFieldObjectAny(
    new FieldObject<ExcludeTags<IUploadFileEndpointParams>>().setFields({
      ...fileMatcherParts,
      data: new FieldBinary().setRequired(true).setDescription('File binary.'),
      description: fReusables.descriptionNotRequired,
      mimetype: mimetypeNotRequired,
      encoding: encodingNotRequired,
      extension: extensionNotRequired,
    })
  )
    .setDescription('Upload file endpoint params.')
    .setName('UploadFileEndpointParams')
);
const uploadFileResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(mddocEndpointStatusCodes.success)
    .setResponseHeaders(mddocEndpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IUploadFileEndpointResult>()
        .setName('UploadFileEndpointSuccessResult')
        .setFields({file})
        .setRequired(true)
        .setDescription('Upload file endpoint success result.')
    ),
];

export const readFileEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(fileConstants.routes.readFile)
  .setPathParamaters([filepathParameterPathname])
  .setMethod(HttpEndpointMethod.Post)
  .setQuery(
    asFieldObjectAny(
      new FieldObject<IReadFileEndpointQueryParams>().setFields({
        w: widthNotRequired,
        h: heightNotRequired,
      })
    )
  )
  .setRequestBody(asFieldObjectAny(readFileParams))
  .setResponses(readFileResult)
  .setName('ReadFileEndpoint')
  .setDescription('Read file endpoint.');

export const uploadFileEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(fileConstants.routes.uploadFile)
  .setPathParamaters([filepathParameterPathname])
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updloadFileParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(uploadFileResult)
  .setName('UploadFileEndpoint')
  .setDescription('Upload file endpoint.');

export const getFileDetailsEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(fileConstants.routes.getFileDetails)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getFileDetailsParams))
  .setRequestHeaders(mddocEndpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getFileDetailsResult)
  .setName('GetFileDetailsEndpoint')
  .setDescription('Get file details endpoint.');

export const updateFileDetailsEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(fileConstants.routes.updateFileDetails)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(updateFileDetailsParams))
  .setRequestHeaders(mddocEndpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(updateFileDetailsResult)
  .setName('UpdateFileDetailsEndpoint')
  .setDescription('Update file details endpoint.');

export const deleteFileEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(fileConstants.routes.deleteFile)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(asFieldObjectAny(deleteFileParams))
  .setRequestHeaders(mddocEndpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(endpointHttpResponseItems.emptyEndpointResponse)
  .setName('DeleteFileEndpoint')
  .setDescription('Delete file endpoint.');

export const fileEndpointsParts = {file};
