import assert from 'assert';
import {FileMatcher, PublicFile} from '../../definitions/file';
import {
  FieldBinaryType,
  FieldObjectFieldsMap,
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  InferSdkParamsType,
  mddocConstruct,
} from '../../mddoc/mddoc';
import {multilineTextToParagraph} from '../../utils/fns';
import {EmptyObject} from '../../utils/types';
import {endpointConstants} from '../constants';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc';
import {HttpEndpointResponseHeaders_ContentType_ContentLength} from '../types';
import {fileConstants} from './constants';
import {DeleteFileEndpointParams} from './deleteFile/types';
import {
  GetFileDetailsEndpointParams,
  GetFileDetailsEndpointResult,
} from './getFileDetails/types';
import {
  GetPresignedPathsForFilesEndpointParams,
  GetPresignedPathsForFilesEndpointResult,
  GetPresignedPathsForFilesItem,
} from './getPresignedPaths/types';
import {
  IssueFilePresignedPathEndpointParams,
  IssueFilePresignedPathEndpointResult,
} from './issueFilePresignedPath/types';
import {
  ImageFormatEnumMap,
  ImageResizeFitEnumMap,
  ImageResizeParams,
  ImageResizePositionEnum,
  ImageResizePositionEnumMap,
  ReadFileEndpointHttpQuery,
  ReadFileEndpointParams,
} from './readFile/types';
import {
  DeleteFileHttpEndpoint,
  FileMatcherPathParameters,
  GetFileDetailsHttpEndpoint,
  GetPresignedPathsForFilesHttpEndpoint,
  IssueFilePresignedPathHttpEndpoint,
  ReadFileGETHttpEndpoint,
  ReadFilePOSTHttpEndpoint,
  UpdateFileDetailsHttpEndpoint,
  UploadFileEndpointHTTPHeaders,
  UploadFileEndpointSdkParams,
  UploadFileHttpEndpoint,
} from './types';
import {
  UpdateFileDetailsEndpointParams,
  UpdateFileDetailsEndpointResult,
  UpdateFileDetailsInput,
} from './updateFileDetails/types';
import {UploadFileEndpointParams, UploadFileEndpointResult} from './uploadFile/types';

const mimetype = mddocConstruct.constructFieldString().setDescription('File MIME type');
const encoding = mddocConstruct.constructFieldString().setDescription('File encoding');
const size = mddocConstruct
  .constructFieldNumber()
  .setDescription('File size in bytes')
  .setMax(fileConstants.maxFileSizeInBytes);
const extension = mddocConstruct.constructFieldString().setDescription('File extension');
const height = mddocConstruct
  .constructFieldNumber()
  .setDescription('Resize to height if file is an image.');
const width = mddocConstruct
  .constructFieldNumber()
  .setDescription('Resize to width if file is an image.');
const fit = mddocConstruct
  .constructFieldString()
  .setDescription('How the image should be resized to fit provided dimensions.')
  .setEnumName('ImageResizeFitEnum')
  .setValid(Object.values(ImageResizeFitEnumMap));
const positionEnum = mddocConstruct
  .constructFieldString()
  .setDescription('Gravity or strategy to use when fit is cover or contain.')
  .setEnumName('ImageResizePositionEnum')
  .setValid(Object.values(ImageResizePositionEnumMap));
const positionNum = mddocConstruct
  .constructFieldNumber()
  .setDescription('Position to use when fit is cover or contain.');
const position = mddocConstruct
  .constructFieldOrCombination<number | ImageResizePositionEnum>()
  .setTypes([positionEnum, positionNum]);
const background = mddocConstruct
  .constructFieldString()
  .setDescription('Hex background color to use when fit is contain.')
  .setExample('#FFFFFF');
const withoutEnlargement = mddocConstruct
  .constructFieldBoolean()
  .setDescription(
    'Do not enlarge if the width or height are already less than provided dimensions.'
  );
const format = mddocConstruct
  .constructFieldString()
  .setDescription('Format to transform image to if file is an image.')
  .setEnumName('ImageFormatEnum')
  .setValid(Object.values(ImageFormatEnumMap));

const version = mddocConstruct
  .constructFieldNumber()
  .setDescription('File version, representing how many times a file has been uploaded.');

const file = mddocConstruct
  .constructFieldObject<PublicFile>()
  .setName('File')
  .setFields({
    size: mddocConstruct.constructFieldObjectField(true, size),
    extension: mddocConstruct.constructFieldObjectField(false, extension),
    resourceId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    workspaceId: mddocConstruct.constructFieldObjectField(true, fReusables.workspaceId),
    parentId: mddocConstruct.constructFieldObjectField(true, fReusables.folderIdOrNull),
    idPath: mddocConstruct.constructFieldObjectField(true, fReusables.idPath),
    namepath: mddocConstruct.constructFieldObjectField(true, fReusables.foldernamepath),
    mimetype: mddocConstruct.constructFieldObjectField(false, mimetype),
    encoding: mddocConstruct.constructFieldObjectField(false, encoding),
    createdBy: mddocConstruct.constructFieldObjectField(true, fReusables.agent),
    createdAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    lastUpdatedBy: mddocConstruct.constructFieldObjectField(true, fReusables.agent),
    lastUpdatedAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    name: mddocConstruct.constructFieldObjectField(true, fReusables.filename),
    description: mddocConstruct.constructFieldObjectField(false, fReusables.description),
    version: mddocConstruct.constructFieldObjectField(true, version),
  });

const updateFileDetailsInput = mddocConstruct
  .constructFieldObject<UpdateFileDetailsInput>()
  .setName('UpdateFileDetailsInput')
  .setFields({
    description: mddocConstruct.constructFieldObjectField(false, fReusables.description),
    mimetype: mddocConstruct.constructFieldObjectField(false, mimetype),
  });

const fileMatcherParts: FieldObjectFieldsMap<FileMatcher> = {
  filepath: mddocConstruct.constructFieldObjectField(false, fReusables.filepath),
  fileId: mddocConstruct.constructFieldObjectField(false, fReusables.fileId),
};

const fileMatcherPathParameters = mddocConstruct
  .constructFieldObject<FileMatcherPathParameters>()
  .setFields({
    filepathOrId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.filepathOrId
    ),
  });

const fileMatcher = mddocConstruct
  .constructFieldObject<FileMatcher>()
  .setName('FileMatcher')
  .setFields({...fileMatcherParts});

const filePresignedPath = mddocConstruct
  .constructFieldString()
  .setDescription(
    'String path that only works with readFile endpoint. Can be used in place of filepath.'
  );

const updateFileDetailsParams = mddocConstruct
  .constructFieldObject<UpdateFileDetailsEndpointParams>()
  .setName('UpdateFileDetailsEndpointParams')
  .setFields({
    file: mddocConstruct.constructFieldObjectField(true, updateFileDetailsInput),
    ...fileMatcherParts,
  });
const updateFileDetailsResponseBody = mddocConstruct
  .constructFieldObject<UpdateFileDetailsEndpointResult>()
  .setName('UpdateFileDetailsEndpointResult')
  .setFields({file: mddocConstruct.constructFieldObjectField(true, file)});

const issueFilePresignedPathParams = mddocConstruct
  .constructFieldObject<IssueFilePresignedPathEndpointParams>()
  .setName('IssueFilePresignedPathEndpointParams')
  .setFields({
    ...fileMatcherParts,
    action: mddocConstruct.constructFieldObjectField(false, fReusables.actionOrList),
    duration: mddocConstruct.constructFieldObjectField(false, fReusables.duration),
    expires: mddocConstruct.constructFieldObjectField(false, fReusables.expires),
    usageCount: mddocConstruct.constructFieldObjectField(
      false,
      mddocConstruct
        .constructFieldNumber()
        .setDescription('How many uses the generated path is valid for.')
    ),
  });
const issueFilePresignedPathResponseBody = mddocConstruct
  .constructFieldObject<IssueFilePresignedPathEndpointResult>()
  .setName('IssueFilePresignedPathEndpointResult')
  .setFields({
    path: mddocConstruct.constructFieldObjectField(true, filePresignedPath),
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
        .setMax(endpointConstants.inputListMax)
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
            path: mddocConstruct.constructFieldObjectField(true, filePresignedPath),
            filepath: mddocConstruct.constructFieldObjectField(true, fReusables.filepath),
          })
      )
    ),
  });

const getFileDetailsParams = mddocConstruct
  .constructFieldObject<GetFileDetailsEndpointParams>()
  .setName('GetFileDetailsEndpointParams')
  .setFields(fileMatcherParts);
const getFileDetailsResponseBody = mddocConstruct
  .constructFieldObject<GetFileDetailsEndpointResult>()
  .setName('GetFileDetailsEndpointResult')
  .setFields({file: mddocConstruct.constructFieldObjectField(true, file)});

const deleteFileParams = mddocConstruct
  .constructFieldObject<DeleteFileEndpointParams>()
  .setName('DeleteFileEndpointParams')
  .setFields(fileMatcherParts);

const readFileParams = mddocConstruct
  .constructFieldObject<ReadFileEndpointParams>()
  .setName('ReadFileEndpointParams')
  .setFields({
    ...fileMatcherParts,
    imageResize: mddocConstruct.constructFieldObjectField(
      false,
      mddocConstruct
        .constructFieldObject<ImageResizeParams>()
        .setFields({
          width: mddocConstruct.constructFieldObjectField(false, width),
          height: mddocConstruct.constructFieldObjectField(false, height),
          fit: mddocConstruct.constructFieldObjectField(false, fit),
          position: mddocConstruct.constructFieldObjectField(false, position),
          background: mddocConstruct.constructFieldObjectField(false, background),
          withoutEnlargement: mddocConstruct.constructFieldObjectField(
            false,
            withoutEnlargement
          ),
        })
        .setName('ImageResizeParams')
    ),
    imageFormat: mddocConstruct.constructFieldObjectField(false, format),
  });
const readFileQuery = mddocConstruct
  .constructFieldObject<ReadFileEndpointHttpQuery>()
  .setFields({
    w: mddocConstruct.constructFieldObjectField(false, width),
    h: mddocConstruct.constructFieldObjectField(false, height),
    pos: mddocConstruct.constructFieldObjectField(false, position),
    fit: mddocConstruct.constructFieldObjectField(false, fit),
    bg: mddocConstruct.constructFieldObjectField(false, background),
    withoutEnlargement: mddocConstruct.constructFieldObjectField(
      false,
      withoutEnlargement
    ),
    format: mddocConstruct.constructFieldObjectField(false, format),
  });
const readFileResponseHeaders = mddocConstruct
  .constructFieldObject<HttpEndpointResponseHeaders_ContentType_ContentLength>()
  .setFields({
    'Content-Type': mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldString()
        .setDescription(
          'Get file endpoint result content type. ' +
            "If request is successful, it will be the file's content type " +
            'if it is known or application/octet-stream otherwise, ' +
            'and application/json containing errors if request fails.'
        )
    ),
    'Content-Length': mddocConstruct.constructFieldObjectField(
      true,
      mddocEndpointHttpHeaderItems.responseHeaderItem_ContentLength
    ),
  });
const readFileResponseBody = mddocConstruct.constructFieldBinary();

const uploadFileParams = mddocConstruct
  .constructHttpEndpointMultipartFormdata<Pick<UploadFileEndpointParams, 'data'>>()
  .setItems(
    mddocConstruct
      .constructFieldObject<Pick<UploadFileEndpointParams, 'data'>>()
      .setFields({
        data: mddocConstruct.constructFieldObjectField(
          true,
          mddocConstruct
            .constructFieldBinary()
            .setDescription('File binary.')
            .setMax(fileConstants.maxFileSizeInBytes)
        ),
      })
      .setName('UploadFileEndpointParams')
  );

const uploadFileSdkParamsDef = mddocConstruct
  .constructFieldObject<UploadFileEndpointSdkParams>()
  .setFields({
    ...fileMatcherParts,
    data: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldBinary()
        .setDescription('File binary.')
        .setMax(fileConstants.maxFileSizeInBytes)
    ),
    description: mddocConstruct.constructFieldObjectField(false, fReusables.description),
    encoding: mddocConstruct.constructFieldObjectField(false, encoding),
    mimetype: mddocConstruct.constructFieldObjectField(false, mimetype),
  })
  .setName('UploadFileEndpointParams');

const updloadFileSdkParams = mddocConstruct
  .constructSdkParamsBody<
    /** TSdkParams */ UploadFileEndpointSdkParams,
    /** TRequestHeaders */ UploadFileEndpointHTTPHeaders,
    /** TPathParameters */ FileMatcherPathParameters,
    /** TQuery */ EmptyObject,
    /** TRequestBody */ Pick<UploadFileEndpointParams, 'data'>
  >(key => {
    switch (key) {
      case 'data':
        return ['body', 'data'];
      case 'description':
        return ['header', 'x-fimidara-file-description'];
      case 'encoding':
        return ['header', 'content-encoding'];
      case 'filepath':
        return ['path', 'filepathOrId'];
      case 'fileId':
        return ['path', 'filepathOrId'];
      default:
        throw new Error(`unknown key ${key}`);
    }
  })
  .setDef(uploadFileSdkParamsDef);

const uploadMultipartWithAuthOptionalHeaderFields =
  mddocEndpointHttpHeaderItems.requestHeaders_AuthOptional_MultipartContentType.fields;
assert(uploadMultipartWithAuthOptionalHeaderFields);
const uploadFileEndpointHTTPHeaders = mddocConstruct
  .constructFieldObject<UploadFileEndpointHTTPHeaders>()
  .setFields({
    ...uploadMultipartWithAuthOptionalHeaderFields,
    'content-length': mddocConstruct.constructFieldObjectField(true, size),
    'x-fimidara-file-description': mddocConstruct.constructFieldObjectField(
      false,
      fReusables.description
    ),
    'x-fimidara-file-mimetype': mddocConstruct.constructFieldObjectField(false, mimetype),
    'content-encoding': mddocConstruct.constructFieldObjectField(false, encoding),
  })

  .setName('UploadFileEndpointHTTPHeaders');
const uploadFileResponseBody = mddocConstruct
  .constructFieldObject<UploadFileEndpointResult>()
  .setName('UploadFileEndpointResult')
  .setFields({file: mddocConstruct.constructFieldObjectField(true, file)});
export const readFilePOSTEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      ReadFilePOSTHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      ReadFilePOSTHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<ReadFilePOSTHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      ReadFilePOSTHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      ReadFilePOSTHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      ReadFilePOSTHttpEndpoint['mddocHttpDefinition']['responseBody'],
      FieldBinaryType
    >
  >()
  .setBasePathname(fileConstants.routes.readFile)
  .setPathParamaters(fileMatcherPathParameters)
  .setMethod(HttpEndpointMethod.Post)
  .setQuery(readFileQuery)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthOptional_JsonContentType
  )
  .setRequestBody(readFileParams)
  .setResponseHeaders(readFileResponseHeaders)
  .setResponseBody(readFileResponseBody)
  .setName('ReadFileEndpoint');

export const readFileGETEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      ReadFileGETHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      ReadFileGETHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<ReadFileGETHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      ReadFileGETHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      ReadFileGETHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      ReadFileGETHttpEndpoint['mddocHttpDefinition']['responseBody'],
      FieldBinaryType
    >
  >()
  .setBasePathname(fileConstants.routes.readFile)
  .setPathParamaters(fileMatcherPathParameters)
  .setMethod(HttpEndpointMethod.Get)
  .setQuery(readFileQuery)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthOptional)
  .setResponseHeaders(readFileResponseHeaders)
  .setResponseBody(readFileResponseBody)
  .setName('ReadFileEndpoint');

export const uploadFileEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<UploadFileHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<UploadFileHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<UploadFileHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      UploadFileHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      UploadFileHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<UploadFileHttpEndpoint['mddocHttpDefinition']['responseBody']>,
    InferSdkParamsType<UploadFileHttpEndpoint['mddocHttpDefinition']['sdkParamsBody']>
  >()
  .setBasePathname(fileConstants.routes.uploadFile)
  .setPathParamaters(fileMatcherPathParameters)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(uploadFileParams)
  .setRequestHeaders(uploadFileEndpointHTTPHeaders)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(uploadFileResponseBody)
  .setSdkParamsBody(updloadFileSdkParams)
  .setName('UploadFileEndpoint');

export const getFileDetailsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetFileDetailsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetFileDetailsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<GetFileDetailsHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      GetFileDetailsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetFileDetailsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetFileDetailsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(fileConstants.routes.getFileDetails)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getFileDetailsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getFileDetailsResponseBody)
  .setName('GetFileDetailsEndpoint');

export const updateFileDetailsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      UpdateFileDetailsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      UpdateFileDetailsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<UpdateFileDetailsHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      UpdateFileDetailsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      UpdateFileDetailsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      UpdateFileDetailsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(fileConstants.routes.updateFileDetails)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateFileDetailsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(updateFileDetailsResponseBody)
  .setName('UpdateFileDetailsEndpoint');

export const deleteFileEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<DeleteFileHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<DeleteFileHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<DeleteFileHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      DeleteFileHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      DeleteFileHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<DeleteFileHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(fileConstants.routes.deleteFile)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deleteFileParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeleteFileEndpoint');

export const issueFilePresignedPathEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      IssueFilePresignedPathHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      IssueFilePresignedPathHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      IssueFilePresignedPathHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      IssueFilePresignedPathHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      IssueFilePresignedPathHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      IssueFilePresignedPathHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(fileConstants.routes.issueFilePresignedPath)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(issueFilePresignedPathParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(issueFilePresignedPathResponseBody)
  .setName('IssueFilePresignedPathEndpoint')
  .setDescription(
    multilineTextToParagraph(
      `Issues file presigned paths for reading private files without passing Authorization header, like in <img /> html tags.
      It's only supports reading files at the moment. Eventually, we'll support uploading files.`
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
  .setBasePathname(fileConstants.routes.getPresignedPaths)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getPresignedPathsForFilesParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getPresignedPathsForFilesResponseBody)
  .setName('GetPresignedPathsForFilesEndpoint')
  .setDescription(
    'Retrieves file presigned paths for reading private files without passing Authorization header, like in <img /> html tags.'
  );

export const fileEndpointsParts = {file};
