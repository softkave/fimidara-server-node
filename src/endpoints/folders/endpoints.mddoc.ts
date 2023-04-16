import {IFolderMatcher, IPublicFolder} from '../../definitions/folder';
import {AppResourceType} from '../../definitions/system';
import {ExcludeTags} from '../../definitions/tag';
import {
  FieldArray,
  FieldBoolean,
  FieldObject,
  FieldObjectFields,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
  HttpEndpointResponse,
  asFieldObjectAny,
  cloneAndMarkNotRequired,
} from '../../mddoc/mddoc';
import {
  endpointHttpResponseItems,
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointStatusCodes,
} from '../endpoints.mddoc';
import {fileEndpointsParts} from '../files/endpoints.mddoc';
import {
  IAddFolderEndpointParams,
  IAddFolderEndpointResult,
  INewFolderInput,
} from './addFolder/types';
import {folderConstants} from './constants';
import {IDeleteFolderEndpointParams} from './deleteFolder/types';
import {IGetFolderEndpointParams, IGetFolderEndpointResult} from './getFolder/types';
import {
  IListFolderContentEndpointParams,
  IListFolderContentEndpointResult,
} from './listFolderContent/types';
import {
  IUpdateFolderEndpointParams,
  IUpdateFolderEndpointResult,
  IUpdateFolderInput,
} from './updateFolder/types';

const newFolderInput = new FieldObject<ExcludeTags<INewFolderInput>>()
  .setName('NewFolderInput')
  .setFields({
    description: fReusables.descriptionNotRequired,
    folderpath: fReusables.folderpath,
    // publicAccessOps: cloneAndMarkNotRequired(folderPublicAccessOpInputList),
  });

const updateFolderInput = new FieldObject<ExcludeTags<IUpdateFolderInput>>()
  .setName('UpdateFolderInput')
  .setFields({
    description: fReusables.descriptionNotRequired,
    // publicAccessOps: cloneAndMarkNotRequired(folderPublicAccessOpInputList),
    removePublicAccessOps: cloneAndMarkNotRequired(
      new FieldBoolean().setDescription('Whether to clear all current public access permissions')
    ),
  });

const folder = new FieldObject<IPublicFolder>().setName('Folder').setFields({
  resourceId: new FieldString(),
  createdBy: fReusables.agent,
  createdAt: fReusables.date,
  lastUpdatedBy: fReusables.agent,
  lastUpdatedAt: fReusables.date,
  name: fReusables.name,
  description: fReusables.descriptionOrUndefined,
  workspaceId: fReusables.workspaceId,
  idPath: fReusables.idPath,
  namePath: fReusables.folderNamePath,
  parentId: fReusables.folderIdOrUndefined,
  providedResourceId: fReusables.providedResourceIdOrUndefined,
});

const folderMatcherParts: FieldObjectFields<IFolderMatcher> = {
  folderpath: fReusables.folderpathNotRequired,
  folderId: fReusables.folderIdNotRequied,
};

const addFolderParams = new FieldObject<IAddFolderEndpointParams>()
  .setName('AddFolderEndpointParams')
  .setFields({
    folder: newFolderInput,
  })
  .setRequired(true)
  .setDescription('Add folder endpoint params.');
const addFolderResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(mddocEndpointStatusCodes.success)
    .setResponseHeaders(mddocEndpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IAddFolderEndpointResult>()
        .setName('AddFolderEndpointSuccessResult')
        .setFields({folder})
        .setRequired(true)
        .setDescription('Add folder endpoint success result.')
    ),
];

const listFolderContentParams = new FieldObject<IListFolderContentEndpointParams>()
  .setName('ListFolderContentEndpointParams')
  .setFields({
    ...folderMatcherParts,
    contentType: new FieldString()
      .setRequired(false)
      .setDescription('Fetch children files or folders or both.')
      .setExample(AppResourceType.File)
      .setValid([AppResourceType.File, AppResourceType.Folder]),
    page: fReusables.pageNotRequired,
    pageSize: fReusables.pageSizeNotRequired,
  })
  .setRequired(true)
  .setDescription('List folder content endpoint params.');
const listFolderContentResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(mddocEndpointStatusCodes.success)
    .setResponseHeaders(mddocEndpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IListFolderContentEndpointResult>()
        .setName('ListFolderContentEndpointSuccessResult')
        .setFields({
          folders: new FieldArray().setType(folder),
          files: new FieldArray().setType(fileEndpointsParts.file),
          page: fReusables.page,
        })
        .setRequired(true)
        .setDescription('List folder content endpoint success result.')
    ),
];

const updateFolderParams = new FieldObject<IUpdateFolderEndpointParams>()
  .setName('UpdateFolderEndpointParams')
  .setFields({
    ...folderMatcherParts,
    folder: updateFolderInput,
  })
  .setRequired(true)
  .setDescription('Update folder endpoint params.');
const updateFolderResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(mddocEndpointStatusCodes.success)
    .setResponseHeaders(mddocEndpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IUpdateFolderEndpointResult>()
        .setName('UpdateFolderEndpointSuccessResult')
        .setFields({folder})
        .setRequired(true)
        .setDescription('Update folder endpoint success result.')
    ),
];

const getFolderParams = new FieldObject<IGetFolderEndpointParams>()
  .setName('GetFolderEndpointParams')
  .setFields(folderMatcherParts)
  .setRequired(true)
  .setDescription('Get folder endpoint params.');
const getFolderResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(mddocEndpointStatusCodes.success)
    .setResponseHeaders(mddocEndpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IGetFolderEndpointResult>()
        .setName('GetFolderEndpointSuccessResult')
        .setFields({folder})
        .setRequired(true)
        .setDescription('Get folder endpoint success result.')
    ),
];

const deleteFolderParams = new FieldObject<IDeleteFolderEndpointParams>()
  .setName('DeleteFolderEndpointParams')
  .setFields(folderMatcherParts)
  .setRequired(true)
  .setDescription('Delete folder endpoint params.');

export const addFolderEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(folderConstants.routes.addFolder)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(addFolderParams))
  .setRequestHeaders(mddocEndpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(addFolderResult)
  .setName('AddFolderEndpoint')
  .setDescription('Add folder endpoint.');

export const getFolderEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(folderConstants.routes.getFolder)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getFolderParams))
  .setRequestHeaders(mddocEndpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getFolderResult)
  .setName('GetFolderEndpoint')
  .setDescription('Get folder endpoint.');

export const updateFolderEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(folderConstants.routes.updateFolder)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(updateFolderParams))
  .setRequestHeaders(mddocEndpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(updateFolderResult)
  .setName('UpdateFolderEndpoint')
  .setDescription('Update folder endpoint.');

export const deleteFolderEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(folderConstants.routes.deleteFolder)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(asFieldObjectAny(deleteFolderParams))
  .setRequestHeaders(mddocEndpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(endpointHttpResponseItems.emptyEndpointResponse)
  .setName('DeleteFolderEndpoint')
  .setDescription('Delete folder endpoint.');

export const listFolderContentEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(folderConstants.routes.listFolderContent)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(listFolderContentParams))
  .setRequestHeaders(mddocEndpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(listFolderContentResult)
  .setName('ListFolderContentEndpoint')
  .setDescription('List folder content endpoint.');
