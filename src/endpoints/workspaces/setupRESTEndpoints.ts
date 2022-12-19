import {Express} from 'express';
import {UsageRecordCategory} from '../../definitions/usageRecord';
import {IUsageThreshold, IUsageThresholdLock, IWorkspace, WorkspaceBillStatus} from '../../definitions/workspace';
import {
  FieldBoolean,
  FieldNumber,
  FieldObject,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointHeaders,
  HttpEndpointMethod,
  orUndefined,
} from '../../mddoc/mddoc';
import {IBaseContext} from '../contexts/types';
import {fReusables, httpHeaderItems, httpResponseItems} from '../endpoints';
import {IBaseEndpointResult} from '../types';
import {wrapEndpointREST} from '../utils';
import addWorkspace from './addWorkspace/handler';
import {IAddWorkspaceEndpointParams, IAddWorkspaceEndpointResult} from './addWorkspace/types';
import deleteWorkspace from './deleteWorkspace/handler';
import getRequestWorkspace from './getRequestWorkspace/handler';
import getUserWorkspaces from './getUserWorkspaces/handler';
import getWorkspace from './getWorkspace/handler';
import updateWorkspace from './updateWorkspace/handler';

const workspaceName = new FieldString(true, 'Workspace name', 'fimidara');
const workspaceRootname = new FieldString(
  true,
  'Workspace root name, must be a URL compatible name',
  'fimidara-rootname'
);
const workspaceDescription = new FieldString(
  true,
  'Workspace description',
  'fimidara, a super awesome company that offers file management with access control for devs'
);
const usageRecordCategory = new FieldString(
  true,
  'Usage record category',
  UsageRecordCategory.Storage,
  Object.values(UsageRecordCategory)
);
const price = new FieldNumber(true, 'Price in USD', 5);
const usageThreshold = new FieldObject<IUsageThreshold>('UsageThreshold', {
  lastUpdatedBy: fReusables.agent,
  lastUpdatedAt: fReusables.date,
  category: usageRecordCategory,
  budget: price,
});
const usageThresholdLock = new FieldObject<IUsageThresholdLock>('UsageThresholdLock', {
  lastUpdatedBy: fReusables.agent,
  lastUpdatedAt: fReusables.date,
  category: usageRecordCategory,
  locked: new FieldBoolean(true, 'Flag for whether a certain usage category is locked or not', false),
});

export const addWorkspaceEndpointDefinition = new HttpEndpointDefinition(
  /** basePathname */ '/workspaces/addWorkspace',
  /** method */ HttpEndpointMethod.Post,
  /** parameterPathnames */ undefined,
  /** query */ undefined,
  /** requestBody */ new FieldObject<IAddWorkspaceEndpointParams>(
    'AddWorkspaceEndpointParams',
    {
      name: workspaceName,
      rootname: workspaceRootname,
      description: orUndefined(workspaceDescription),
    },
    true
  ),
  /** requestHeaders */ new HttpEndpointHeaders([
    httpHeaderItems.authorizationHeaderItem,
    httpHeaderItems.jsonRequestContentTypeHeaderItem,
  ]),
  /** responseBody */ new FieldObject<IAddWorkspaceEndpointResult & IBaseEndpointResult>(
    'AddWorkspaceEndpointResult',
    {
      ...httpResponseItems.responseWithErrorRaw,
      workspace: orUndefined(
        new FieldObject<IWorkspace>('Workspace', {
          resourceId: new FieldString(),
          createdBy: fReusables.agent,
          createdAt: fReusables.date,
          lastUpdatedBy: fReusables.agent,
          lastUpdatedAt: fReusables.date,
          name: workspaceName,
          rootname: workspaceRootname,
          description: workspaceDescription,
          publicPermissionGroupId: fReusables.idOrUndefined,
          billStatusAssignedAt: fReusables.dateOrUndefined,
          billStatus: orUndefined(
            new FieldString(false, 'Workspace bill status', WorkspaceBillStatus.Ok, [
              Object.values(WorkspaceBillStatus),
            ])
          ),
          usageThresholds: orUndefined(
            new FieldObject<IWorkspace['usageThresholds']>('WorkspaceUsageThresholds', {
              [UsageRecordCategory.Storage]: orUndefined(usageThreshold),
              [UsageRecordCategory.BandwidthIn]: orUndefined(usageThreshold),
              [UsageRecordCategory.BandwidthOut]: orUndefined(usageThreshold),
              [UsageRecordCategory.Total]: orUndefined(usageThreshold),
            })
          ),
          usageThresholdLocks: orUndefined(
            new FieldObject<IWorkspace['usageThresholdLocks']>('WorkspaceUsageThresholdLocks', {
              [UsageRecordCategory.Storage]: orUndefined(usageThresholdLock),
              [UsageRecordCategory.BandwidthIn]: orUndefined(usageThresholdLock),
              [UsageRecordCategory.BandwidthOut]: orUndefined(usageThresholdLock),
              [UsageRecordCategory.Total]: orUndefined(usageThresholdLock),
            })
          ),
        })
      ),
    },
    true,
    'Add workspace endpoint result'
  ),
  /** responseHeaders */ new HttpEndpointHeaders([httpHeaderItems.jsonResponseContentTypeHeaderItem])
);

export default function setupWorkspacesRESTEndpoints(ctx: IBaseContext, app: Express) {
  const endpoints = {
    addWorkspace: wrapEndpointREST(addWorkspace, ctx),
    deleteWorkspace: wrapEndpointREST(deleteWorkspace, ctx),
    getWorkspace: wrapEndpointREST(getWorkspace, ctx),
    getRequestWorkspace: wrapEndpointREST(getRequestWorkspace, ctx),
    getUserWorkspaces: wrapEndpointREST(getUserWorkspaces, ctx),
    updateWorkspace: wrapEndpointREST(updateWorkspace, ctx),
  };

  app.post('/workspaces/addWorkspace', endpoints.addWorkspace);
  app.delete('/workspaces/deleteWorkspace', endpoints.deleteWorkspace);
  app.post('/workspaces/getUserWorkspaces', endpoints.getUserWorkspaces);
  app.post('/workspaces/getWorkspace', endpoints.getWorkspace);
  app.post('/workspaces/getRequestWorkspace', endpoints.getRequestWorkspace);
  app.post('/workspaces/updateWorkspace', endpoints.updateWorkspace);
}
