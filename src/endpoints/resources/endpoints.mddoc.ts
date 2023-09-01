import {Resource, ResourceWrapper} from '../../definitions/system';
import {
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc';
import {fReusables, mddocEndpointHttpHeaderItems} from '../endpoints.mddoc';
import resourcesConstants from './constants';
import {GetResourcesEndpointParams, GetResourcesEndpointResult} from './getResources/types';
import {FetchResourceItem, GetResourcesHttpEndpoint} from './types';

const fetchResourceItemInput = mddocConstruct
  .constructFieldObject<FetchResourceItem>()
  .setName('FetchResourceItem')
  .setFields({
    resourceId: mddocConstruct.constructFieldObjectField(false, fReusables.id),
    filepath: mddocConstruct.constructFieldObjectField(false, fReusables.filepath),
    folderpath: mddocConstruct.constructFieldObjectField(false, fReusables.folderpath),
    workspaceRootname: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceRootname
    ),
  });

const resource = mddocConstruct
  .constructFieldObject<FetchResourceItem>()
  .setName('FetchResourceItem')
  .setFields({
    resourceId: mddocConstruct.constructFieldObjectField(false, fReusables.id),
    filepath: mddocConstruct.constructFieldObjectField(false, fReusables.filepath),
    folderpath: mddocConstruct.constructFieldObjectField(false, fReusables.folderpath),
    workspaceRootname: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceRootname
    ),
  });

const getResourcesParams = mddocConstruct
  .constructFieldObject<GetResourcesEndpointParams>()
  .setName('ResourceWrapper')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(false, fReusables.workspaceIdInput),
    resources: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<FetchResourceItem>().setType(fetchResourceItemInput)
    ),
  });

const resourceWrapper = mddocConstruct
  .constructFieldObject<ResourceWrapper>()
  .setName('ResourceWrapper')
  .setFields({
    resourceId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    resourceType: mddocConstruct.constructFieldObjectField(true, fReusables.resourceType),
    resource: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldObject<Resource>()
        .setDescription('Resource shape depends on resource type.')
        .setFields({
          resourceId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
          createdAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
          lastUpdatedAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
        })
    ),
  });

const getResourcesResponseBody = mddocConstruct
  .constructFieldObject<GetResourcesEndpointResult>()
  .setName('GetResourcesEndpointResult')
  .setFields({
    resources: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<ResourceWrapper>().setType(resourceWrapper)
    ),
  })
  .setDescription('Get resources endpoint success result.');

export const getResourcesEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<GetResourcesHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<GetResourcesHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<GetResourcesHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<GetResourcesHttpEndpoint['mddocHttpDefinition']['requestBody']>,
    InferFieldObjectType<GetResourcesHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<GetResourcesHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(resourcesConstants.routes.getResources)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getResourcesParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getResourcesResponseBody)
  .setName('GetResourcesEndpoint');
