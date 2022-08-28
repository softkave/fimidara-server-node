import {IPublicWorkspace} from '../../../definitions/workspace';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IGetUserWorkspacesEndpointResult {
  workspaces: IPublicWorkspace[];
}

export type GetUserWorkspacesEndpoint = Endpoint<
  IBaseContext,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {},
  IGetUserWorkspacesEndpointResult
>;
