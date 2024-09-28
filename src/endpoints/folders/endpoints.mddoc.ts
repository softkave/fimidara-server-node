import {PublicFile} from '../../definitions/file.js';
import {FolderMatcher, PublicFolder} from '../../definitions/folder.js';
import {kFimidaraPublicResourceType} from '../../definitions/system.js';
import {
  FieldObjectFieldsMap,
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc.js';
import {fReusables, mddocEndpointHttpHeaderItems} from '../endpoints.mddoc.js';
import {fileEndpointsParts} from '../files/endpoints.mddoc.js';
import {
  AddFolderEndpointParams,
  AddFolderEndpointResult,
} from './addFolder/types.js';
import {kFolderConstants} from './constants.js';
import {
  CountFolderContentEndpointParams,
  CountFolderContentEndpointResult,
} from './countFolderContent/types.js';
import {
  DeleteFolderEndpointParams,
  DeleteFolderEndpointResult,
} from './deleteFolder/types.js';
import {
  GetFolderEndpointParams,
  GetFolderEndpointResult,
} from './getFolder/types.js';
import {
  ListFolderContentEndpointParams,
  ListFolderContentEndpointResult,
} from './listFolderContent/types.js';
import {
  AddFolderHttpEndpoint,
  CountFolderContentHttpEndpoint,
  DeleteFolderHttpEndpoint,
  GetFolderHttpEndpoint,
  ListFolderContentHttpEndpoint,
  UpdateFolderHttpEndpoint,
} from './types.js';
import {
  UpdateFolderEndpointParams,
  UpdateFolderEndpointResult,
  UpdateFolderInput,
} from './updateFolder/types.js';

const updateFolderInput = mddocConstruct
  .constructFieldObject<UpdateFolderInput>()
  .setName('UpdateFolderInput')
  .setFields({
    description: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.description
    ),
  });

const folder = mddocConstruct
  .constructFieldObject<PublicFolder>()
  .setName('Folder')
  .setFields({
    ...fReusables.workspaceResourceParts,
    name: mddocConstruct.constructFieldObjectField(true, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.description
    ),
    idPath: mddocConstruct.constructFieldObjectField(true, fReusables.idPath),
    namepath: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.foldernamepath
    ),
    parentId: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.folderIdOrNull
    ),
  });

const folderMatcherParts: FieldObjectFieldsMap<FolderMatcher> = {
  folderpath: mddocConstruct.constructFieldObjectField(
    false,
    fReusables.folderpath
  ),
  folderId: mddocConstruct.constructFieldObjectField(
    false,
    fReusables.folderId
  ),
};

const addFolderParams = mddocConstruct
  .constructFieldObject<AddFolderEndpointParams>()
  .setName('AddFolderEndpointParams')
  .setFields({
    description: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.description
    ),
    folderpath: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.folderpath
    ),
  });
const addFolderResponseBody = mddocConstruct
  .constructFieldObject<AddFolderEndpointResult>()
  .setName('AddFolderEndpointResult')
  .setFields({
    folder: mddocConstruct.constructFieldObjectField(true, folder),
    notes: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.resultNoteList
    ),
  });

const listFolderContentParams = mddocConstruct
  .constructFieldObject<ListFolderContentEndpointParams>()
  .setName('ListFolderContentEndpointParams')
  .setFields({
    ...folderMatcherParts,
    contentType: mddocConstruct.constructFieldObjectField(
      false,
      mddocConstruct
        .constructFieldString()
        .setDescription(
          'Fetch children files or folders. To fetch both, pass nothing'
        )
        .setExample(kFimidaraPublicResourceType.File)
        .setValid([
          kFimidaraPublicResourceType.File,
          kFimidaraPublicResourceType.Folder,
        ])
    ),
    page: mddocConstruct.constructFieldObjectField(false, fReusables.page),
    pageSize: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.pageSize
    ),
  });
const listFolderContentResponseBody = mddocConstruct
  .constructFieldObject<ListFolderContentEndpointResult>()
  .setName('ListFolderContentEndpointResult')
  .setFields({
    folders: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<PublicFolder>().setType(folder)
    ),
    files: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldArray<PublicFile>()
        .setType(fileEndpointsParts.file)
    ),
    page: mddocConstruct.constructFieldObjectField(true, fReusables.page),
    notes: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.resultNoteList
    ),
  });

const countFolderContentParams = mddocConstruct
  .constructFieldObject<CountFolderContentEndpointParams>()
  .setName('CountFolderContentEndpointParams')
  .setFields({
    ...folderMatcherParts,
    contentType: mddocConstruct.constructFieldObjectField(
      false,
      mddocConstruct
        .constructFieldString()
        .setDescription(
          'Count children files or folders. To count both, pass nothing'
        )
        .setExample(kFimidaraPublicResourceType.File)
        .setValid([
          kFimidaraPublicResourceType.File,
          kFimidaraPublicResourceType.Folder,
        ])
    ),
  });
const countFolderContentResponseBody = mddocConstruct
  .constructFieldObject<CountFolderContentEndpointResult>()
  .setName('CountFolderContentEndpointResult')
  .setFields({
    foldersCount: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldNumber()
    ),
    filesCount: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldNumber()
    ),
    notes: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.resultNoteList
    ),
  });

const updateFolderParams = mddocConstruct
  .constructFieldObject<UpdateFolderEndpointParams>()
  .setName('UpdateFolderEndpointParams')
  .setFields({
    ...folderMatcherParts,
    folder: mddocConstruct.constructFieldObjectField(true, updateFolderInput),
  });
const updateFolderResponseBody = mddocConstruct
  .constructFieldObject<UpdateFolderEndpointResult>()
  .setName('UpdateFolderEndpointResult')
  .setFields({folder: mddocConstruct.constructFieldObjectField(true, folder)});

const getFolderParams = mddocConstruct
  .constructFieldObject<GetFolderEndpointParams>()
  .setName('GetFolderEndpointParams')
  .setFields(folderMatcherParts);
const getFolderResponseBody = mddocConstruct
  .constructFieldObject<GetFolderEndpointResult>()
  .setName('GetFolderEndpointResult')
  .setFields({folder: mddocConstruct.constructFieldObjectField(true, folder)});

const deleteFolderParams = mddocConstruct
  .constructFieldObject<DeleteFolderEndpointParams>()
  .setName('DeleteFolderEndpointParams')
  .setFields(folderMatcherParts);
const deleteFolderResponseBody = mddocConstruct
  .constructFieldObject<DeleteFolderEndpointResult>()
  .setName('DeleteFolderEndpointResult')
  .setFields({
    jobId: mddocConstruct.constructFieldObjectField(false, fReusables.jobId),
    notes: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.resultNoteList
    ),
  });

export const addFolderEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      AddFolderHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      AddFolderHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<AddFolderHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      AddFolderHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      AddFolderHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      AddFolderHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kFolderConstants.routes.addFolder)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(addFolderParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(addFolderResponseBody)
  .setName('AddFolderEndpoint');

export const getFolderEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetFolderHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetFolderHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<GetFolderHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      GetFolderHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetFolderHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetFolderHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kFolderConstants.routes.getFolder)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getFolderParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(getFolderResponseBody)
  .setName('GetFolderEndpoint');

export const updateFolderEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      UpdateFolderHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      UpdateFolderHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      UpdateFolderHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      UpdateFolderHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      UpdateFolderHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      UpdateFolderHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kFolderConstants.routes.updateFolder)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateFolderParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(updateFolderResponseBody)
  .setName('UpdateFolderEndpoint');

export const deleteFolderEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      DeleteFolderHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      DeleteFolderHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      DeleteFolderHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      DeleteFolderHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      DeleteFolderHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      DeleteFolderHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kFolderConstants.routes.deleteFolder)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deleteFolderParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(deleteFolderResponseBody)
  .setName('DeleteFolderEndpoint');

export const listFolderContentEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      ListFolderContentHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      ListFolderContentHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      ListFolderContentHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      ListFolderContentHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      ListFolderContentHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      ListFolderContentHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kFolderConstants.routes.listFolderContent)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(listFolderContentParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(listFolderContentResponseBody)
  .setName('ListFolderContentEndpoint');

export const countFolderContentEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      CountFolderContentHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      CountFolderContentHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      CountFolderContentHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      CountFolderContentHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      CountFolderContentHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      CountFolderContentHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kFolderConstants.routes.countFolderContent)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(countFolderContentParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(countFolderContentResponseBody)
  .setName('CountFolderContentEndpoint');
