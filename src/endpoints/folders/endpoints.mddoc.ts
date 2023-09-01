import {PublicFile} from '../../definitions/file';
import {FolderMatcher, PublicFolder} from '../../definitions/folder';
import {AppResourceType} from '../../definitions/system';
import {
  FieldObjectFieldsMap,
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc';
import {fileEndpointsParts} from '../files/endpoints.mddoc';
import {AddFolderEndpointParams, AddFolderEndpointResult, NewFolderInput} from './addFolder/types';
import {folderConstants} from './constants';
import {
  CountFolderContentEndpointParams,
  CountFolderContentEndpointResult,
} from './countFolderContent/types';
import {DeleteFolderEndpointParams} from './deleteFolder/types';
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

const folder = mddocConstruct
  .constructFieldObject<PublicFolder>()
  .setName('Folder')
  .setFields({
    resourceId: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldString()
    ),
    createdBy: mddocConstruct.constructFieldObjectField(true, fReusables.agent),
    createdAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    lastUpdatedBy: mddocConstruct.constructFieldObjectField(true, fReusables.agent),
    lastUpdatedAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    name: mddocConstruct.constructFieldObjectField(true, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(false, fReusables.description),
    workspaceId: mddocConstruct.constructFieldObjectField(true, fReusables.workspaceId),
    idPath: mddocConstruct.constructFieldObjectField(true, fReusables.idPath),
    namePath: mddocConstruct.constructFieldObjectField(true, fReusables.folderNamePath),
    parentId: mddocConstruct.constructFieldObjectField(true, fReusables.folderIdOrNull),
    providedResourceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.providedResourceId
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
  })
  .setDescription('Add folder endpoint params.');
const addFolderResponseBody = mddocConstruct
  .constructFieldObject<AddFolderEndpointResult>()
  .setName('AddFolderEndpointResult')
  .setFields({folder: mddocConstruct.constructFieldObjectField(true, folder)})
  .setDescription('Add folder endpoint success result.');

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
        .setExample(AppResourceType.File)
        .setValid([AppResourceType.File, AppResourceType.Folder])
    ),
    page: mddocConstruct.constructFieldObjectField(false, fReusables.page),
    pageSize: mddocConstruct.constructFieldObjectField(false, fReusables.pageSize),
  })
  .setDescription('List folder content endpoint params.');
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
  })
  .setDescription('List folder content endpoint success result.');

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
        .setExample(AppResourceType.File)
        .setValid([AppResourceType.File, AppResourceType.Folder])
    ),
  })
  .setDescription('List folder content endpoint params.');
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
  })
  .setDescription('Count folder content endpoint success result.');

const updateFolderParams = mddocConstruct
  .constructFieldObject<UpdateFolderEndpointParams>()
  .setName('UpdateFolderEndpointParams')
  .setFields({
    ...folderMatcherParts,
    folder: mddocConstruct.constructFieldObjectField(true, updateFolderInput),
  })
  .setDescription('Update folder endpoint params.');
const updateFolderResponseBody = mddocConstruct
  .constructFieldObject<UpdateFolderEndpointResult>()
  .setName('UpdateFolderEndpointResult')
  .setFields({folder: mddocConstruct.constructFieldObjectField(true, folder)})
  .setDescription('Update folder endpoint success result.');

const getFolderParams = mddocConstruct
  .constructFieldObject<GetFolderEndpointParams>()
  .setName('GetFolderEndpointParams')
  .setFields(folderMatcherParts)
  .setDescription('Get folder endpoint params.');
const getFolderResponseBody = mddocConstruct
  .constructFieldObject<GetFolderEndpointResult>()
  .setName('GetFolderEndpointResult')
  .setFields({folder: mddocConstruct.constructFieldObjectField(true, folder)})
  .setDescription('Get folder endpoint success result.');

const deleteFolderParams = mddocConstruct
  .constructFieldObject<DeleteFolderEndpointParams>()
  .setName('DeleteFolderEndpointParams')
  .setFields(folderMatcherParts)
  .setDescription('Delete folder endpoint params.');

export const addFolderEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<AddFolderHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<AddFolderHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<AddFolderHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<AddFolderHttpEndpoint['mddocHttpDefinition']['requestBody']>,
    InferFieldObjectType<AddFolderHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<AddFolderHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(folderConstants.routes.addFolder)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(addFolderParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(addFolderResponseBody)
  .setName('AddFolderEndpoint')
  .setDescription('Add folder endpoint.');

export const getFolderEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<GetFolderHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<GetFolderHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<GetFolderHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<GetFolderHttpEndpoint['mddocHttpDefinition']['requestBody']>,
    InferFieldObjectType<GetFolderHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<GetFolderHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(folderConstants.routes.getFolder)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getFolderParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getFolderResponseBody)
  .setName('GetFolderEndpoint')
  .setDescription('Get folder endpoint.');

export const updateFolderEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<UpdateFolderHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<UpdateFolderHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<UpdateFolderHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<UpdateFolderHttpEndpoint['mddocHttpDefinition']['requestBody']>,
    InferFieldObjectType<UpdateFolderHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<UpdateFolderHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(folderConstants.routes.updateFolder)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateFolderParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(updateFolderResponseBody)
  .setName('UpdateFolderEndpoint')
  .setDescription('Update folder endpoint.');

export const deleteFolderEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<DeleteFolderHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<DeleteFolderHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<DeleteFolderHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<DeleteFolderHttpEndpoint['mddocHttpDefinition']['requestBody']>,
    InferFieldObjectType<DeleteFolderHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<DeleteFolderHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(folderConstants.routes.deleteFolder)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deleteFolderParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeleteFolderEndpoint')
  .setDescription('Delete folder endpoint.');

export const listFolderContentEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<ListFolderContentHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<ListFolderContentHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<ListFolderContentHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      ListFolderContentHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<ListFolderContentHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<ListFolderContentHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(folderConstants.routes.listFolderContent)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(listFolderContentParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(listFolderContentResponseBody)
  .setName('ListFolderContentEndpoint')
  .setDescription('List folder content endpoint.');

export const countFolderContentEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<CountFolderContentHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<CountFolderContentHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<CountFolderContentHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      CountFolderContentHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<CountFolderContentHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<CountFolderContentHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(folderConstants.routes.countFolderContent)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(countFolderContentParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(countFolderContentResponseBody)
  .setName('CountFolderContentEndpoint')
  .setDescription('Count folder content endpoint.');
