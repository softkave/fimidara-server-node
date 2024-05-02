import {PublicResource, PublicResourceWrapper} from '../../definitions/system.js';
import {
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc.js';
import {fReusables, mddocEndpointHttpHeaderItems} from '../endpoints.mddoc.js';
import resourcesConstants from './constants.js';
import {
  GetResourcesEndpointParams,
  GetResourcesEndpointResult,
} from './getResources/types.js';
import {FetchResourceItem, GetResourcesHttpEndpoint} from './types.js';

const fetchResourceItemInput = mddocConstruct
  .constructFieldObject<FetchResourceItem>()
  .setName('FetchResourceItem')
  .setFields({
    resourceId: mddocConstruct.constructFieldObjectField(false, fReusables.idOrList),
    action: mddocConstruct.constructFieldObjectField(true, fReusables.action),
    filepath: mddocConstruct.constructFieldObjectField(false, fReusables.filepathOrList),
    folderpath: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.folderpathOrList
    ),
    workspaceRootname: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceRootname
    ),
  });

const getResourcesParams = mddocConstruct
  .constructFieldObject<GetResourcesEndpointParams>()
  .setName('GetResourcesEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    resources: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldArray<FetchResourceItem>()
        .setType(fetchResourceItemInput)
    ),
  });

const resourceWrapper = mddocConstruct
  .constructFieldObject<PublicResourceWrapper>()
  .setName('ResourceWrapper')
  .setFields({
    resourceId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    resourceType: mddocConstruct.constructFieldObjectField(true, fReusables.resourceType),
    resource: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldObject<PublicResource>()
        .setName('Resource')
        .setDescription('Resource shape depends on resource type')
        .setFields({
          ...fReusables.resourceParts,
        })
    ),
  });

const getResourcesResponseBody = mddocConstruct
  .constructFieldObject<GetResourcesEndpointResult>()
  .setName('GetResourcesEndpointResult')
  .setFields({
    resources: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<PublicResourceWrapper>().setType(resourceWrapper)
    ),
  });
export const getResourcesEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetResourcesHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetResourcesHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<GetResourcesHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      GetResourcesHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetResourcesHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<GetResourcesHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(resourcesConstants.routes.getResources)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getResourcesParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getResourcesResponseBody)
  .setName('GetResourcesEndpoint');
