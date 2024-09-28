import {
  kFileBackendType,
  PublicFileBackendConfig,
  PublicFileBackendMount,
} from '../../definitions/fileBackend.js';
import {
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc.js';
import {multilineTextToParagraph} from '../../utils/fns.js';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc.js';
import {
  AddFileBackendConfigEndpointParams,
  AddFileBackendConfigEndpointResult,
} from './addConfig/types.js';
import {
  AddFileBackendMountEndpointParams,
  AddFileBackendMountEndpointResult,
} from './addMount/types.js';
import {kFileBackendConstants} from './constants.js';
import {CountFileBackendConfigsEndpointParams} from './countConfigs/types.js';
import {CountFileBackendMountsEndpointParams} from './countMounts/types.js';
import {DeleteFileBackendConfigEndpointParams} from './deleteConfig/types.js';
import {DeleteFileBackendMountEndpointParams} from './deleteMount/types.js';
import {
  GetFileBackendConfigEndpointParams,
  GetFileBackendConfigEndpointResult,
} from './getConfig/types.js';
import {
  GetFileBackendConfigsEndpointParams,
  GetFileBackendConfigsEndpointResult,
} from './getConfigs/types.js';
import {
  GetFileBackendMountEndpointParams,
  GetFileBackendMountEndpointResult,
} from './getMount/types.js';
import {
  GetFileBackendMountsEndpointParams,
  GetFileBackendMountsEndpointResult,
} from './getMounts/types.js';
import {
  ResolveFileBackendMountsEndpointParams,
  ResolveFileBackendMountsEndpointResult,
} from './resolveMounts/types.js';
import {
  AddFileBackendConfigHttpEndpoint,
  AddFileBackendMountHttpEndpoint,
  CountFileBackendConfigsHttpEndpoint,
  CountFileBackendMountsHttpEndpoint,
  DeleteFileBackendConfigHttpEndpoint,
  DeleteFileBackendMountHttpEndpoint,
  GetFileBackendConfigHttpEndpoint,
  GetFileBackendConfigsHttpEndpoint,
  GetFileBackendMountHttpEndpoint,
  GetFileBackendMountsHttpEndpoint,
  ResolveFileBackendMountsHttpEndpoint,
  UpdateFileBackendConfigHttpEndpoint,
  UpdateFileBackendMountHttpEndpoint,
} from './types.js';
import {
  UpdateFileBackendConfigEndpointParams,
  UpdateFileBackendConfigEndpointResult,
  UpdateFileBackendConfigInput,
} from './updateConfig/types.js';
import {
  UpdateFileBackendMountEndpointParams,
  UpdateFileBackendMountEndpointResult,
  UpdateFileBackendMountInput,
} from './updateMount/types.js';

const backend = mddocConstruct
  .constructFieldString()
  .setDescription('File backend type')
  .setExample(kFileBackendType.fimidara)
  .setValid(Object.values(kFileBackendType))
  .setEnumName('FileBackendType');

const configId = fReusables.id.clone().setDescription('Backend config ID');
const configIdOrNull = mddocConstruct
  .constructFieldOrCombination<string | null>()
  .setTypes([configId, fReusables.nullValue]);

const index = mddocConstruct
  .constructFieldNumber()
  .setDescription(
    'File backend mount weight when compared to mounts attached to the same folder. ' +
      'Higher values have higher weight'
  );

const mountedFrom = fReusables.folderpath
  .clone()
  .setDescription(
    multilineTextToParagraph(`
      Files mount source. Exact shape is different for each provider. For AWS S3, this would be
      just the bucket name or bucket name with folder prefix. E.g my-bucket or my-bucket/folder01 assuming
      there is a folder01 within my-bucket.
    `)
  )
  .setExample('/bucket-name/folder-name');
const mountedFromAsList = fReusables.folderpathList.clone().setDescription(
  multilineTextToParagraph(`
      Files mount source. Exact shape is different for each provider. For AWS S3, this would be
      just the bucket name or bucket name with folder prefix. E.g ["my-bucket"] or ["my-bucket", "folder01"] assuming
      there is a folder01 within my-bucket.
    `)
);

const credentials = mddocConstruct
  .constructFieldObject<Record<string, unknown>>()
  .setFields({})
  .setName('FileBackendConfigCredentials')
  .setDescription(
    multilineTextToParagraph(`
      Exact shape depends on backend.
  `)
  );

const updateFileBackendMountInput = mddocConstruct
  .constructFieldObject<UpdateFileBackendMountInput>()
  .setName('UpdateFileBackendMountInput')
  .setFields({
    name: mddocConstruct.constructFieldObjectField(false, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.description
    ),
    configId: mddocConstruct.constructFieldObjectField(false, configId),
    folderpath: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.folderpath
    ),
    index: mddocConstruct.constructFieldObjectField(false, index),
    mountedFrom: mddocConstruct.constructFieldObjectField(false, mountedFrom),
  });

const fileBackendMount = mddocConstruct
  .constructFieldObject<PublicFileBackendMount>()
  .setName('FileBackendMount')
  .setFields({
    ...fReusables.workspaceResourceParts,
    name: mddocConstruct.constructFieldObjectField(true, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.description
    ),
    backend: mddocConstruct.constructFieldObjectField(true, backend),
    configId: mddocConstruct.constructFieldObjectField(true, configIdOrNull),
    namepath: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.folderpathList
    ),
    index: mddocConstruct.constructFieldObjectField(true, index),
    mountedFrom: mddocConstruct.constructFieldObjectField(
      true,
      mountedFromAsList
    ),
  });

const fileBackendMountList = mddocConstruct
  .constructFieldArray<PublicFileBackendMount>()
  .setType(fileBackendMount);

const updateFileBackendConfigInput = mddocConstruct
  .constructFieldObject<UpdateFileBackendConfigInput>()
  .setName('UpdateFileBackendConfigInput')
  .setFields({
    name: mddocConstruct.constructFieldObjectField(false, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.description
    ),
    credentials: mddocConstruct.constructFieldObjectField(false, credentials),
  });

const fileBackendConfig = mddocConstruct
  .constructFieldObject<PublicFileBackendConfig>()
  .setName('FileBackendConfig')
  .setFields({
    ...fReusables.workspaceResourceParts,
    name: mddocConstruct.constructFieldObjectField(true, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.description
    ),
    backend: mddocConstruct.constructFieldObjectField(true, backend),
  });

const fileBackendConfigList = mddocConstruct
  .constructFieldArray<PublicFileBackendConfig>()
  .setType(fileBackendConfig);

const addFileBackendMountParams = mddocConstruct
  .constructFieldObject<AddFileBackendMountEndpointParams>()
  .setName('AddFileBackendMountEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceId
    ),
    name: mddocConstruct.constructFieldObjectField(true, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.description
    ),
    backend: mddocConstruct.constructFieldObjectField(true, backend),
    folderpath: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.folderpath
    ),
    configId: mddocConstruct.constructFieldObjectField(true, configIdOrNull),
    index: mddocConstruct.constructFieldObjectField(true, index),
    mountedFrom: mddocConstruct.constructFieldObjectField(true, mountedFrom),
  });
const addFileBackendMountSuccessResponseBody = mddocConstruct
  .constructFieldObject<AddFileBackendMountEndpointResult>()
  .setName('AddFileBackendMountEndpointResult')
  .setFields({
    mount: mddocConstruct.constructFieldObjectField(true, fileBackendMount),
  });

const getFileBackendMountsParams = mddocConstruct
  .constructFieldObject<GetFileBackendMountsEndpointParams>()
  .setName('GetFileBackendMountsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    backend: mddocConstruct.constructFieldObjectField(false, backend),
    folderpath: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.folderpath
    ),
    configId: mddocConstruct.constructFieldObjectField(false, fReusables.id),
    page: mddocConstruct.constructFieldObjectField(false, fReusables.page),
    pageSize: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.pageSize
    ),
  });
const getFileBackendMountsSuccessResponseBody = mddocConstruct
  .constructFieldObject<GetFileBackendMountsEndpointResult>()
  .setName('GetFileBackendMountsEndpointResult')
  .setFields({
    mounts: mddocConstruct.constructFieldObjectField(
      true,
      fileBackendMountList
    ),
    page: mddocConstruct.constructFieldObjectField(true, fReusables.page),
  });

const countFileBackendMountsParams = mddocConstruct
  .constructFieldObject<CountFileBackendMountsEndpointParams>()
  .setName('CountFileBackendMountsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    backend: mddocConstruct.constructFieldObjectField(false, backend),
    folderpath: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.folderpath
    ),
    configId: mddocConstruct.constructFieldObjectField(false, fReusables.id),
  });

const updateFileBackendMountParams = mddocConstruct
  .constructFieldObject<UpdateFileBackendMountEndpointParams>()
  .setName('UpdateFileBackendMountEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    mountId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    mount: mddocConstruct.constructFieldObjectField(
      true,
      updateFileBackendMountInput
    ),
  });
const updateFileBackendMountSuccessResponseBody = mddocConstruct
  .constructFieldObject<UpdateFileBackendMountEndpointResult>()
  .setName('UpdateFileBackendMountEndpointResult')
  .setFields({
    mount: mddocConstruct.constructFieldObjectField(true, fileBackendMount),
    jobId: mddocConstruct.constructFieldObjectField(false, fReusables.jobId),
  });

const getFileBackendMountParams = mddocConstruct
  .constructFieldObject<GetFileBackendMountEndpointParams>()
  .setName('GetFileBackendMountEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    mountId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
  });
const getFileBackendMountSuccessBody = mddocConstruct
  .constructFieldObject<GetFileBackendMountEndpointResult>()
  .setName('GetFileBackendMountEndpointResult')
  .setFields({
    mount: mddocConstruct.constructFieldObjectField(true, fileBackendMount),
  });

const deleteFileBackendMountParams = mddocConstruct
  .constructFieldObject<DeleteFileBackendMountEndpointParams>()
  .setName('DeleteFileBackendMountEndpointParams')
  .setFields({
    mountId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
  });

const resolveFileBackendMountsParams = mddocConstruct
  .constructFieldObject<ResolveFileBackendMountsEndpointParams>()
  .setName('ResolveFileBackendMountsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    folderId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.folderId
    ),
    folderpath: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.folderpath
    ),
    fileId: mddocConstruct.constructFieldObjectField(false, fReusables.fileId),
    filepath: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.filepath
    ),
  });
const resolveFileBackendMountsSuccessResponseBody = mddocConstruct
  .constructFieldObject<ResolveFileBackendMountsEndpointResult>()
  .setName('ResolveFileBackendMountsEndpointResult')
  .setFields({
    mounts: mddocConstruct.constructFieldObjectField(
      true,
      fileBackendMountList
    ),
  });

const addFileBackendConfigParams = mddocConstruct
  .constructFieldObject<AddFileBackendConfigEndpointParams>()
  .setName('AddFileBackendConfigEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceId
    ),
    name: mddocConstruct.constructFieldObjectField(true, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.description
    ),
    backend: mddocConstruct.constructFieldObjectField(true, backend),
    credentials: mddocConstruct.constructFieldObjectField(true, credentials),
  });
const addFileBackendConfigSuccessResponseBody = mddocConstruct
  .constructFieldObject<AddFileBackendConfigEndpointResult>()
  .setName('AddFileBackendConfigEndpointResult')
  .setFields({
    config: mddocConstruct.constructFieldObjectField(true, fileBackendConfig),
  });

const getFileBackendConfigsParams = mddocConstruct
  .constructFieldObject<GetFileBackendConfigsEndpointParams>()
  .setName('GetFileBackendConfigsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    backend: mddocConstruct.constructFieldObjectField(false, backend),
    page: mddocConstruct.constructFieldObjectField(false, fReusables.page),
    pageSize: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.pageSize
    ),
  });
const getFileBackendConfigsSuccessResponseBody = mddocConstruct
  .constructFieldObject<GetFileBackendConfigsEndpointResult>()
  .setName('GetFileBackendConfigsEndpointResult')
  .setFields({
    configs: mddocConstruct.constructFieldObjectField(
      true,
      fileBackendConfigList
    ),
    page: mddocConstruct.constructFieldObjectField(true, fReusables.page),
  });

const countFileBackendConfigsParams = mddocConstruct
  .constructFieldObject<CountFileBackendConfigsEndpointParams>()
  .setName('CountFileBackendConfigsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    backend: mddocConstruct.constructFieldObjectField(false, backend),
  });

const updateFileBackendConfigParams = mddocConstruct
  .constructFieldObject<UpdateFileBackendConfigEndpointParams>()
  .setName('UpdateFileBackendConfigEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    configId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    config: mddocConstruct.constructFieldObjectField(
      true,
      updateFileBackendConfigInput
    ),
  });
const updateFileBackendConfigSuccessResponseBody = mddocConstruct
  .constructFieldObject<UpdateFileBackendConfigEndpointResult>()
  .setName('UpdateFileBackendConfigEndpointResult')
  .setFields({
    config: mddocConstruct.constructFieldObjectField(true, fileBackendConfig),
  });

const getFileBackendConfigParams = mddocConstruct
  .constructFieldObject<GetFileBackendConfigEndpointParams>()
  .setName('GetFileBackendConfigEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    configId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
  });
const getFileBackendConfigSuccessBody = mddocConstruct
  .constructFieldObject<GetFileBackendConfigEndpointResult>()
  .setName('GetFileBackendConfigEndpointResult')
  .setFields({
    config: mddocConstruct.constructFieldObjectField(true, fileBackendConfig),
  });

const deleteFileBackendConfigParams = mddocConstruct
  .constructFieldObject<DeleteFileBackendConfigEndpointParams>()
  .setName('DeleteFileBackendConfigEndpointParams')
  .setFields({
    configId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
  });

export const addFileBackendMountEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      AddFileBackendMountHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      AddFileBackendMountHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      AddFileBackendMountHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      AddFileBackendMountHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      AddFileBackendMountHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      AddFileBackendMountHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kFileBackendConstants.routes.addMount)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(addFileBackendMountParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseBody(addFileBackendMountSuccessResponseBody)
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setName('AddFileBackendMountEndpoint');

export const getFileBackendMountEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetFileBackendMountHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetFileBackendMountHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetFileBackendMountHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      GetFileBackendMountHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetFileBackendMountHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetFileBackendMountHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kFileBackendConstants.routes.getMount)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getFileBackendMountParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(getFileBackendMountSuccessBody)
  .setName('GetFileBackendMountEndpoint');

export const updateFileBackendMountEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      UpdateFileBackendMountHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      UpdateFileBackendMountHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      UpdateFileBackendMountHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      UpdateFileBackendMountHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      UpdateFileBackendMountHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      UpdateFileBackendMountHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kFileBackendConstants.routes.updateMount)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateFileBackendMountParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(updateFileBackendMountSuccessResponseBody)
  .setName('UpdateFileBackendMountEndpoint');

export const deleteFileBackendMountEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      DeleteFileBackendMountHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      DeleteFileBackendMountHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      DeleteFileBackendMountHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      DeleteFileBackendMountHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      DeleteFileBackendMountHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      DeleteFileBackendMountHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kFileBackendConstants.routes.deleteMount)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deleteFileBackendMountParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeleteFileBackendMountEndpoint');

export const getFileBackendMountsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetFileBackendMountsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetFileBackendMountsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetFileBackendMountsHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      GetFileBackendMountsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetFileBackendMountsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetFileBackendMountsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kFileBackendConstants.routes.getMounts)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getFileBackendMountsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(getFileBackendMountsSuccessResponseBody)
  .setName('GetFileBackendMountsEndpoint');

export const countFileBackendMountsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      CountFileBackendMountsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      CountFileBackendMountsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      CountFileBackendMountsHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      CountFileBackendMountsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      CountFileBackendMountsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      CountFileBackendMountsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kFileBackendConstants.routes.countMounts)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(countFileBackendMountsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
  .setName('CountFileBackendMountsEndpoint');

export const resolveFileBackendMountsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      ResolveFileBackendMountsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      ResolveFileBackendMountsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      ResolveFileBackendMountsHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      ResolveFileBackendMountsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      ResolveFileBackendMountsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      ResolveFileBackendMountsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kFileBackendConstants.routes.resolveMounts)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(resolveFileBackendMountsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(resolveFileBackendMountsSuccessResponseBody)
  .setName('ResolveFileBackendMountsEndpoint');

export const addFileBackendConfigEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      AddFileBackendConfigHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      AddFileBackendConfigHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      AddFileBackendConfigHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      AddFileBackendConfigHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      AddFileBackendConfigHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      AddFileBackendConfigHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kFileBackendConstants.routes.addConfig)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(addFileBackendConfigParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseBody(addFileBackendConfigSuccessResponseBody)
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setName('AddFileBackendConfigEndpoint');

export const getFileBackendConfigEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetFileBackendConfigHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetFileBackendConfigHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetFileBackendConfigHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      GetFileBackendConfigHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetFileBackendConfigHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetFileBackendConfigHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kFileBackendConstants.routes.getConfig)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getFileBackendConfigParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(getFileBackendConfigSuccessBody)
  .setName('GetFileBackendConfigEndpoint');

export const updateFileBackendConfigEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      UpdateFileBackendConfigHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      UpdateFileBackendConfigHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      UpdateFileBackendConfigHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      UpdateFileBackendConfigHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      UpdateFileBackendConfigHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      UpdateFileBackendConfigHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kFileBackendConstants.routes.updateConfig)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateFileBackendConfigParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(updateFileBackendConfigSuccessResponseBody)
  .setName('UpdateFileBackendConfigEndpoint');

export const deleteFileBackendConfigEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      DeleteFileBackendConfigHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      DeleteFileBackendConfigHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      DeleteFileBackendConfigHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      DeleteFileBackendConfigHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      DeleteFileBackendConfigHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      DeleteFileBackendConfigHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kFileBackendConstants.routes.deleteConfig)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deleteFileBackendConfigParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeleteFileBackendConfigEndpoint');

export const getFileBackendConfigsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetFileBackendConfigsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetFileBackendConfigsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetFileBackendConfigsHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      GetFileBackendConfigsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetFileBackendConfigsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetFileBackendConfigsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kFileBackendConstants.routes.getConfigs)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getFileBackendConfigsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(getFileBackendConfigsSuccessResponseBody)
  .setName('GetFileBackendConfigsEndpoint');

export const countFileBackendConfigsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      CountFileBackendConfigsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      CountFileBackendConfigsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      CountFileBackendConfigsHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      CountFileBackendConfigsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      CountFileBackendConfigsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      CountFileBackendConfigsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kFileBackendConstants.routes.countConfigs)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(countFileBackendConfigsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
  .setName('CountFileBackendConfigsEndpoint');
