import {IFolderMatcher, IPublicFolder} from '../../definitions/folder';
import {PermissionItemAppliesTo} from '../../definitions/permissionItem';
import {AppResourceType, IPublicAccessOpInput} from '../../definitions/system';
import {ExcludeTags} from '../../definitions/tag';
import {
  asFieldObjectAny,
  cloneAndMarkNotRequired,
  FieldArray,
  FieldBoolean,
  FieldObject,
  FieldObjectFields,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
  HttpEndpointResponse,
} from '../../mddoc/mddoc';
import {endpointHttpHeaderItems, endpointHttpResponseItems, endpointStatusCodes, fReusables} from '../endpoints';
import {fileEndpointsParts} from '../files/endpoints';
import {permissionItemConstants} from '../permissionItems/constants';
import {IAddFolderEndpointParams, IAddFolderEndpointResult, INewFolderInput} from './addFolder/types';
import {IDeleteFolderEndpointParams} from './deleteFolder/types';
import {IGetFolderEndpointParams, IGetFolderEndpointResult} from './getFolder/types';
import {IListFolderContentEndpointParams, IListFolderContentEndpointResult} from './listFolderContent/types';
import {IUpdateFolderEndpointParams, IUpdateFolderEndpointResult, IUpdateFolderInput} from './updateFolder/types';

const folderPublicAccessOpInput = new FieldObject<IPublicAccessOpInput>().setName('PublicAccessOpInput').setFields({
  action: fReusables.nonWorkspaceAction,
  resourceType: new FieldString()
    .setRequired(true)
    .setDescription('Resource type this public access permission applies.')
    .setExample(AppResourceType.File)
    .setValid([AppResourceType.Folder, AppResourceType.File]),
  appliesTo: new FieldString()
    .setRequired(true)
    .setDescription(
      "Whether this permission applies to both the containing folder and it's children, just the container, or just the children."
    )
    .setExample(PermissionItemAppliesTo.OwnerAndChildren)
    .setValid(Object.values(PermissionItemAppliesTo)),
});

const folderPublicAccessOpInputList = new FieldArray()
  .setType(folderPublicAccessOpInput)
  .setMax(permissionItemConstants.maxPermissionItemsSavedPerRequest);

const newFolderInput = new FieldObject<ExcludeTags<INewFolderInput>>().setName('NewFolderInput').setFields({
  description: fReusables.descriptionNotRequired,
  folderpath: fReusables.folderpath,
  publicAccessOps: cloneAndMarkNotRequired(folderPublicAccessOpInputList),
});

const updateFolderInput = new FieldObject<ExcludeTags<IUpdateFolderInput>>().setName('UpdateFolderInput').setFields({
  description: fReusables.descriptionNotRequired,
  publicAccessOps: cloneAndMarkNotRequired(folderPublicAccessOpInputList),
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
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
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
  .setFields(folderMatcherParts)
  .setRequired(true)
  .setDescription('List folder content endpoint params.');
const listFolderContentResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IListFolderContentEndpointResult>()
        .setName('ListFolderContentEndpointSuccessResult')
        .setFields({
          folders: new FieldArray().setType(folder),
          files: new FieldArray().setType(fileEndpointsParts.file),
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
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
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
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
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
  .setBasePathname('/folders/addFolder')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(addFolderParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(addFolderResult)
  .setName('Add Folder Endpoint')
  .setDescription('Add folder endpoint.');

export const getFolderEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/folders/getFolder')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getFolderParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getFolderResult)
  .setName('Get Folder Endpoint')
  .setDescription('Get folder endpoint.');

export const updateFolderEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/folders/updateFolder')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(updateFolderParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(updateFolderResult)
  .setName('Update Folder Endpoint')
  .setDescription('Update folder endpoint.');

export const deleteFolderEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/folders/deleteFolder')
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(asFieldObjectAny(deleteFolderParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(endpointHttpResponseItems.emptyEndpointResponse)
  .setName('Delete Folder Endpoint')
  .setDescription('Delete folder endpoint.');

export const listFolderContentEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/folders/listFolderContent')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(listFolderContentParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(listFolderContentResult)
  .setName('List Folder Content Endpoint')
  .setDescription('List folder content endpoint.');
