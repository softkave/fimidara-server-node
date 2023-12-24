import {PublicFile} from '../../definitions/file';
import {
  FolderMatcher,
  FolderResolvedMountEntry,
  PublicFolder,
} from '../../definitions/folder';
import {kAppResourceType} from '../../definitions/system';
import {
  FieldObjectFieldsMap,
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc';
import {fReusables, mddocEndpointHttpHeaderItems} from '../endpoints.mddoc';
import {fileEndpointsParts} from '../files/endpoints.mddoc';
import {
  AddFolderEndpointParams,
  AddFolderEndpointResult,
  NewFolderInput,
} from './addFolder/types';
import {kFolderConstants} from './constants';
import {
  CountFolderContentEndpointParams,
  CountFolderContentEndpointResult,
} from './countFolderContent/types';
import {
  DeleteFolderEndpointParams,
  DeleteFolderEndpointResult,
} from './deleteFolder/types';
import {GetFolderEndpointParams, GetFolderEndpointResult} from './getFolder/types';
import {
  ListFolderContentEndpointParams,
  ListFolderContentEndpointResult,
} from './listFolderContent/types';
import {
  AddFolderHttpEndpoint,
  CountFolderContentHttpEndpoint,
  DeleteFolderHttpEndpoint,
  GetFolderHttpEndpoint,
  ListFolderContentHttpEndpoint,
  UpdateFolderHttpEndpoint,
} from './types';
import {
  UpdateFolderEndpointParams,
  UpdateFolderEndpointResult,
  UpdateFolderInput,
} from './updateFolder/types';

const newFolderInput = mddocConstruct
  .constructFieldObject<NewFolderInput>()
  .setName('NewFolderInput')
  .setFields({
    description: mddocConstruct.constructFieldObjectField(false, fReusables.description),
    folderpath: mddocConstruct.constructFieldObjectField(true, fReusables.folderpath),
  });

const updateFolderInput = mddocConstruct
  .constructFieldObject<UpdateFolderInput>()
  .setName('UpdateFolderInput')
  .setFields({
    description: mddocConstruct.constructFieldObjectField(false, fReusables.description),
  });

const folderResolvedMountEntry = mddocConstruct
  .constructFieldObject<FolderResolvedMountEntry>()
  .setName('FolderResolvedMountEntry')
  .setFields({
    mountId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    resolvedAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
  });

const folderResolvedMountEntryList = mddocConstruct
  .constructFieldArray<FolderResolvedMountEntry>()
  .setType(folderResolvedMountEntry);

const folder = mddocConstruct
  .constructFieldObject<PublicFolder>()
  .setName('Folder')
  .setFields({
    resourceId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    createdBy: mddocConstruct.constructFieldObjectField(true, fReusables.agent),
    createdAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    lastUpdatedBy: mddocConstruct.constructFieldObjectField(true, fReusables.agent),
    lastUpdatedAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    name: mddocConstruct.constructFieldObjectField(true, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(false, fReusables.description),
    workspaceId: mddocConstruct.constructFieldObjectField(true, fReusables.workspaceId),
    idPath: mddocConstruct.constructFieldObjectField(true, fReusables.idPath),
    namepath: mddocConstruct.constructFieldObjectField(true, fReusables.foldernamepath),
    parentId: mddocConstruct.constructFieldObjectField(true, fReusables.folderIdOrNull),
    resolvedEntries: mddocConstruct.constructFieldObjectField(
      true,
      folderResolvedMountEntryList
    ),
  });

const folderMatcherParts: FieldObjectFieldsMap<FolderMatcher> = {
  folderpath: mddocConstruct.constructFieldObjectField(false, fReusables.folderpath),
  folderId: mddocConstruct.constructFieldObjectField(false, fReusables.folderId),
};

const addFolderParams = mddocConstruct
  .constructFieldObject<AddFolderEndpointParams>()
  .setName('AddFolderEndpointParams')
  .setFields({
    folder: mddocConstruct.constructFieldObjectField(true, newFolderInput),
  });
const addFolderResponseBody = mddocConstruct
  .constructFieldObject<AddFolderEndpointResult>()
  .setName('AddFolderEndpointResult')
  .setFields({
    folder: mddocConstruct.constructFieldObjectField(true, folder),
    notes: mddocConstruct.constructFieldObjectField(false, fReusables.resultNoteList),
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
        .setDescription('Fetch children files or folders. To fetch both, pass nothing.')
        .setExample(kAppResourceType.File)
        .setValid([kAppResourceType.File, kAppResourceType.Folder])
    ),
    page: mddocConstruct.constructFieldObjectField(false, fReusables.page),
    pageSize: mddocConstruct.constructFieldObjectField(false, fReusables.pageSize),
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
      mddocConstruct.constructFieldArray<PublicFile>().setType(fileEndpointsParts.file)
    ),
    page: mddocConstruct.constructFieldObjectField(true, fReusables.page),
    notes: mddocConstruct.constructFieldObjectField(false, fReusables.resultNoteList),
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
        .setDescription('Count children files or folders. To count both, pass nothing.')
        .setExample(kAppResourceType.File)
        .setValid([kAppResourceType.File, kAppResourceType.Folder])
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
    notes: mddocConstruct.constructFieldObjectField(false, fReusables.resultNoteList),
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
    notes: mddocConstruct.constructFieldObjectField(false, fReusables.resultNoteList),
  });

export const addFolderEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<AddFolderHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<AddFolderHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<AddFolderHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      AddFolderHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<AddFolderHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<AddFolderHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(kFolderConstants.routes.addFolder)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(addFolderParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(addFolderResponseBody)
  .setName('AddFolderEndpoint');

export const getFolderEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<GetFolderHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<GetFolderHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<GetFolderHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      GetFolderHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<GetFolderHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<GetFolderHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(kFolderConstants.routes.getFolder)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getFolderParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
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
    InferFieldObjectType<UpdateFolderHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      UpdateFolderHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      UpdateFolderHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<UpdateFolderHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(kFolderConstants.routes.updateFolder)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateFolderParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
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
    InferFieldObjectType<DeleteFolderHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      DeleteFolderHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      DeleteFolderHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<DeleteFolderHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(kFolderConstants.routes.deleteFolder)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deleteFolderParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
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
    InferFieldObjectType<ListFolderContentHttpEndpoint['mddocHttpDefinition']['query']>,
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
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
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
    InferFieldObjectType<CountFolderContentHttpEndpoint['mddocHttpDefinition']['query']>,
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
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(countFolderContentResponseBody)
  .setName('CountFolderContentEndpoint');
