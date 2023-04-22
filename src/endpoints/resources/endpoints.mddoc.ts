import {Resource, ResourceWrapper} from '../../definitions/system';
import {
  FieldArray,
  FieldObject,
  HttpEndpointDefinition,
  HttpEndpointMethod,
} from '../../mddoc/mddoc';
import {fReusables, mddocEndpointHttpHeaderItems} from '../endpoints.mddoc';
import {
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import resourcesConstants from './constants';
import {GetResourcesEndpointParams, GetResourcesEndpointResult} from './getResources/types';
import {FetchResourceItem} from './types';

const fetchResourceItemInput = FieldObject.construct<FetchResourceItem>()
  .setName('FetchResourceItem')
  .setFields({
    resourceId: FieldObject.optionalField(fReusables.id),
    filepath: FieldObject.optionalField(fReusables.filepath),
    folderpath: FieldObject.optionalField(fReusables.folderpath),
    workspaceRootname: FieldObject.optionalField(fReusables.workspaceRootname),
  });

const resource = FieldObject.construct<FetchResourceItem>()
  .setName('FetchResourceItem')
  .setFields({
    resourceId: FieldObject.optionalField(fReusables.id),
    filepath: FieldObject.optionalField(fReusables.filepath),
    folderpath: FieldObject.optionalField(fReusables.folderpath),
    workspaceRootname: FieldObject.optionalField(fReusables.workspaceRootname),
  });

const getResourcesParams = FieldObject.construct<GetResourcesEndpointParams>()
  .setName('ResourceWrapper')
  .setFields({
    workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
    resources: FieldObject.requiredField(
      FieldArray.construct<FetchResourceItem>().setType(fetchResourceItemInput)
    ),
  });

const resourceWrapper = FieldObject.construct<ResourceWrapper>()
  .setName('ResourceWrapper')
  .setFields({
    resourceId: FieldObject.requiredField(fReusables.id),
    resourceType: FieldObject.requiredField(fReusables.resourceType),
    resource: FieldObject.requiredField(
      FieldObject.construct<Resource>()
        .setDescription('Resource shape depends on resource type.')
        .setFields({
          resourceId: FieldObject.requiredField(fReusables.id),
          createdAt: FieldObject.requiredField(fReusables.date),
          lastUpdatedAt: FieldObject.requiredField(fReusables.date),
        })
    ),
  })
  .setRequired(true);

const getResourcesResponseBody = FieldObject.construct<GetResourcesEndpointResult>()
  .setName('GetResourcesEndpointResult')
  .setFields({
    resources: FieldObject.requiredField(
      FieldArray.construct<ResourceWrapper>().setType(resourceWrapper)
    ),
  })
  .setRequired(true)
  .setDescription('Get resources endpoint success result.');

export const getResourcesEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetResourcesEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetResourcesEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(resourcesConstants.routes.getResources)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getResourcesParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getResourcesResponseBody)
  .setName('GetResourcesEndpoint');
