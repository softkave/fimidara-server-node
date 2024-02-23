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
import {EmptyObject} from '../../utils/types';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc';
import {
  HttpEndpointRequestHeaders_AuthOptional,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {kFileConstants} from './constants';
import {DeleteFileEndpointParams} from './deleteFile/types';
import {
  GetFileDetailsEndpointParams,
  GetFileDetailsEndpointResult,
} from './getFileDetails/types';
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
  .setMax(kFileConstants.maxFileSizeInBytes);
const extension = mddocConstruct
  .constructFieldString()
  .setDescription('File extension, case insensitive');
const height = mddocConstruct
  .constructFieldNumber()
  .setDescription('Resize to height if file is an image');
const width = mddocConstruct
  .constructFieldNumber()
  .setDescription('Resize to width if file is an image');
const fit = mddocConstruct
  .constructFieldString()
  .setDescription('How the image should be resized to fit provided dimensions')
  .setEnumName('ImageResizeFitEnum')
  .setValid(Object.values(ImageResizeFitEnumMap));
const positionEnum = mddocConstruct
  .constructFieldString()
  .setDescription('Gravity or strategy to use when fit is cover or contain')
  .setEnumName('ImageResizePositionEnum')
  .setValid(Object.values(ImageResizePositionEnumMap));
const positionNum = mddocConstruct
  .constructFieldNumber()
  .setDescription('Position to use when fit is cover or contain');
const position = mddocConstruct
  .constructFieldOrCombination<number | ImageResizePositionEnum>()
  .setTypes([positionEnum, positionNum]);
const background = mddocConstruct
  .constructFieldString()
  .setDescription('Hex background color to use when fit is contain')
  .setExample('#FFFFFF');
const withoutEnlargement = mddocConstruct
  .constructFieldBoolean()
  .setDescription(
    'Do not enlarge if the width or height are already less than provided dimensions'
  );
const format = mddocConstruct
  .constructFieldString()
  .setDescription('Format to transform image to if file is an image')
  .setEnumName('ImageFormatEnum')
  .setValid(Object.values(ImageFormatEnumMap));

const version = mddocConstruct
  .constructFieldNumber()
  .setDescription('File version, representing how many times a file has been uploaded');

const file = mddocConstruct
  .constructFieldObject<PublicFile>()
  .setName('File')
  .setFields({
    ...fReusables.workspaceResourceParts,
    size: mddocConstruct.constructFieldObjectField(true, size),
    extension: mddocConstruct.constructFieldObjectField(false, extension),
    parentId: mddocConstruct.constructFieldObjectField(true, fReusables.folderIdOrNull),
    idPath: mddocConstruct.constructFieldObjectField(true, fReusables.idPath),
    namepath: mddocConstruct.constructFieldObjectField(true, fReusables.foldernamepath),
    mimetype: mddocConstruct.constructFieldObjectField(false, mimetype),
    encoding: mddocConstruct.constructFieldObjectField(false, encoding),
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
            'and application/json containing errors if request fails'
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
            .setDescription('File binary')
            .setMax(kFileConstants.maxFileSizeInBytes)
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
        .setDescription('File binary')
        .setMax(kFileConstants.maxFileSizeInBytes)
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
        return ['header', kFileConstants.headers['x-fimidara-file-description']];
      case 'encoding':
        return ['header', 'content-encoding'];
      case 'filepath':
        return ['path', 'filepathOrId'];
      case 'fileId':
        return ['path', 'filepathOrId'];
      case 'mimetype':
        return ['header', kFileConstants.headers['x-fimidara-file-mimetype']];
      default:
        throw new Error(`unknown key ${key}`);
    }
  })
  .setDef(uploadFileSdkParamsDef)
  .setSerializeAs('formdata');

const readFileSdkParams = mddocConstruct
  .constructSdkParamsBody<
    /** TSdkParams */ ReadFileEndpointParams,
    /** TRequestHeaders */ HttpEndpointRequestHeaders_AuthOptional,
    /** TPathParameters */ FileMatcherPathParameters,
    /** TQuery */ EmptyObject,
    /** TRequestBody */ {}
  >(key => {
    switch (key) {
      case 'filepath':
        return ['path', 'filepathOrId'];
      case 'fileId':
        return ['path', 'filepathOrId'];
      default:
        return undefined;
    }
  })
  .setDef(readFileParams)
  .setSerializeAs('json');

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
    >,
    InferSdkParamsType<ReadFilePOSTHttpEndpoint['mddocHttpDefinition']['sdkParamsBody']>
  >()
  .setBasePathname(kFileConstants.routes.readFile_get)
  .setPathParamaters(fileMatcherPathParameters)
  .setMethod(HttpEndpointMethod.Post)
  .setQuery(readFileQuery)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthOptional_JsonContentType
  )
  .setRequestBody(readFileParams)
  .setResponseHeaders(readFileResponseHeaders)
  .setResponseBody(readFileResponseBody)
  .setSdkParamsBody(readFileSdkParams)
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
    >,
    InferSdkParamsType<ReadFileGETHttpEndpoint['mddocHttpDefinition']['sdkParamsBody']>
  >()
  .setBasePathname(kFileConstants.routes.readFile_get)
  .setPathParamaters(fileMatcherPathParameters)
  .setMethod(HttpEndpointMethod.Get)
  .setQuery(readFileQuery)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthOptional)
  .setResponseHeaders(readFileResponseHeaders)
  .setResponseBody(readFileResponseBody)
  .setSdkParamsBody(readFileSdkParams)
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
  .setBasePathname(kFileConstants.routes.uploadFile_post)
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
  .setBasePathname(kFileConstants.routes.getFileDetails)
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
  .setBasePathname(kFileConstants.routes.updateFileDetails)
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
  .setBasePathname(kFileConstants.routes.deleteFile)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deleteFileParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeleteFileEndpoint');

export const fileEndpointsParts = {file};
