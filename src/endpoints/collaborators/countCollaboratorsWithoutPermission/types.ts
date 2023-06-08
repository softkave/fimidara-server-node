import {BaseContextType} from '../../contexts/types';
import {CountItemsEndpointResult, Endpoint} from '../../types';
import {GetWorkspaceCollaboratorsEndpointParamsBase} from '../getWorkspaceCollaborators/types';

export type CountCollaboratorsWithoutPermissionEndpointParams =
  GetWorkspaceCollaboratorsEndpointParamsBase;

export type CountCollaboratorsWithoutPermissionEndpoint = Endpoint<
  BaseContextType,
  CountCollaboratorsWithoutPermissionEndpointParams,
  CountItemsEndpointResult
>;
