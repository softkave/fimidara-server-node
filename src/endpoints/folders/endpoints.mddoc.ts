import {PublicFile} from '../../definitions/file';
import {FolderMatcher, PublicFolder} from '../../definitions/folder';
import {AppResourceType} from '../../definitions/system';
import {
  FieldArray,
  FieldNumber,
  FieldObject,
  FieldObjectFields,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
} from '../../mddoc/mddoc';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc';
import {fileEndpointsParts} from '../files/endpoints.mddoc';
import {LongRunningJobResult} from '../jobs/types';
import {
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
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
  UpdateFolderEndpointParams,
  UpdateFolderEndpointResult,
  UpdateFolderInput,
} from './updateFolder/types';

const newFolderInput = FieldObject.construct<NewFolderInput>()
  .setName('NewFolderInput')
  .setFields({
    description: FieldObject.optionalField(fReusables.description),
    folderpath: FieldObject.requiredField(fReusables.folderpath),
  });

const updateFolderInput = FieldObject.construct<UpdateFolderInput>()
  .setName('UpdateFolderInput')
  .setFields({
    description: FieldObject.optionalField(fReusables.description),
  });

const folder = FieldObject.construct<PublicFolder>()
  .setName('Folder')
  .setFields({
    resourceId: FieldObject.requiredField(FieldString.construct()),
    createdBy: FieldObject.requiredField(fReusables.agent),
    createdAt: FieldObject.requiredField(fReusables.date),
    lastUpdatedBy: FieldObject.requiredField(fReusables.agent),
    lastUpdatedAt: FieldObject.requiredField(fReusables.date),
    name: FieldObject.requiredField(fReusables.name),
    description: FieldObject.optionalField(fReusables.description),
    workspaceId: FieldObject.requiredField(fReusables.workspaceId),
    idPath: FieldObject.requiredField(fReusables.idPath),
    namePath: FieldObject.requiredField(fReusables.folderNamePath),
    parentId: FieldObject.requiredField(fReusables.folderId),
    providedResourceId: FieldObject.optionalField(fReusables.providedResourceId),
  });

const folderMatcherParts: FieldObjectFields<FolderMatcher> = {
  folderpath: FieldObject.optionalField(fReusables.folderpath),
  folderId: FieldObject.optionalField(fReusables.folderId),
};

const addFolderParams = FieldObject.construct<AddFolderEndpointParams>()
  .setName('AddFolderEndpointParams')
  .setFields({
    folder: FieldObject.requiredField(newFolderInput),
  })
  .setRequired(true)
  .setDescription('Add folder endpoint params.');
const addFolderResponseBody = FieldObject.construct<AddFolderEndpointResult>()
  .setName('AddFolderEndpointSuccessResult')
  .setFields({folder: FieldObject.requiredField(folder)})
  .setRequired(true)
  .setDescription('Add folder endpoint success result.');

const listFolderContentParams = FieldObject.construct<ListFolderContentEndpointParams>()
  .setName('ListFolderContentEndpointParams')
  .setFields({
    ...folderMatcherParts,
    contentType: FieldObject.optionalField(
      FieldString.construct()
        .setRequired(false)
        .setDescription('Fetch children files or folders or both.')
        .setExample(AppResourceType.File)
        .setValid([AppResourceType.File, AppResourceType.Folder])
    ),
    page: FieldObject.optionalField(fReusables.page),
    pageSize: FieldObject.optionalField(fReusables.pageSize),
  })
  .setRequired(true)
  .setDescription('List folder content endpoint params.');
const listFolderContentResponseBody = FieldObject.construct<ListFolderContentEndpointResult>()
  .setName('ListFolderContentEndpointSuccessResult')
  .setFields({
    folders: FieldObject.requiredField(FieldArray.construct<PublicFolder>().setType(folder)),
    files: FieldObject.requiredField(
      FieldArray.construct<PublicFile>().setType(fileEndpointsParts.file)
    ),
    page: FieldObject.requiredField(fReusables.page),
  })
  .setRequired(true)
  .setDescription('List folder content endpoint success result.');

const countFolderContentParams = FieldObject.construct<CountFolderContentEndpointParams>()
  .setName('CountFolderContentEndpointParams')
  .setFields({
    ...folderMatcherParts,
    contentType: FieldObject.optionalField(
      FieldString.construct()
        .setRequired(false)
        .setDescription('Count children files or folders or both.')
        .setExample(AppResourceType.File)
        .setValid([AppResourceType.File, AppResourceType.Folder])
    ),
  })
  .setRequired(true)
  .setDescription('List folder content endpoint params.');
const countFolderContentResponseBody = FieldObject.construct<CountFolderContentEndpointResult>()
  .setName('CountFolderContentEndpointSuccessResult')
  .setFields({
    foldersCount: FieldObject.requiredField(FieldNumber.construct()),
    filesCount: FieldObject.requiredField(FieldNumber.construct()),
  })
  .setRequired(true)
  .setDescription('Count folder content endpoint success result.');

const updateFolderParams = FieldObject.construct<UpdateFolderEndpointParams>()
  .setName('UpdateFolderEndpointParams')
  .setFields({
    ...folderMatcherParts,
    folder: FieldObject.requiredField(updateFolderInput),
  })
  .setRequired(true)
  .setDescription('Update folder endpoint params.');
const updateFolderResponseBody = FieldObject.construct<UpdateFolderEndpointResult>()
  .setName('UpdateFolderEndpointSuccessResult')
  .setFields({folder: FieldObject.requiredField(folder)})
  .setRequired(true)
  .setDescription('Update folder endpoint success result.');

const getFolderParams = FieldObject.construct<GetFolderEndpointParams>()
  .setName('GetFolderEndpointParams')
  .setFields(folderMatcherParts)
  .setRequired(true)
  .setDescription('Get folder endpoint params.');
const getFolderResponseBody = FieldObject.construct<GetFolderEndpointResult>()
  .setName('GetFolderEndpointSuccessResult')
  .setFields({folder: FieldObject.requiredField(folder)})
  .setRequired(true)
  .setDescription('Get folder endpoint success result.');

const deleteFolderParams = FieldObject.construct<DeleteFolderEndpointParams>()
  .setName('DeleteFolderEndpointParams')
  .setFields(folderMatcherParts)
  .setRequired(true)
  .setDescription('Delete folder endpoint params.');

export const addFolderEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: AddFolderEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: AddFolderEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(folderConstants.routes.addFolder)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(addFolderParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(addFolderResponseBody)
  .setName('AddFolderEndpoint')
  .setDescription('Add folder endpoint.');

export const getFolderEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetFolderEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetFolderEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(folderConstants.routes.getFolder)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getFolderParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getFolderResponseBody)
  .setName('GetFolderEndpoint')
  .setDescription('Get folder endpoint.');

export const updateFolderEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: UpdateFolderEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: UpdateFolderEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(folderConstants.routes.updateFolder)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateFolderParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(updateFolderResponseBody)
  .setName('UpdateFolderEndpoint')
  .setDescription('Update folder endpoint.');

export const deleteFolderEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: DeleteFolderEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: LongRunningJobResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(folderConstants.routes.deleteFolder)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deleteFolderParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeleteFolderEndpoint')
  .setDescription('Delete folder endpoint.');

export const listFolderContentEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: ListFolderContentEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: ListFolderContentEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(folderConstants.routes.listFolderContent)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(listFolderContentParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(listFolderContentResponseBody)
  .setName('ListFolderContentEndpoint')
  .setDescription('List folder content endpoint.');

export const countFolderContentEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: CountFolderContentEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: CountFolderContentEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(folderConstants.routes.countFolderContent)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(countFolderContentParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(countFolderContentResponseBody)
  .setName('CountFolderContentEndpoint')
  .setDescription('Count folder content endpoint.');
