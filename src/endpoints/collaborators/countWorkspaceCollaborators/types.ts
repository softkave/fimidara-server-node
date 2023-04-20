import {BaseContext} from '../../contexts/types';
import {CountItemsEndpointResult, Endpoint} from '../../types';
import {GetWorkspaceCollaboratorsEndpointParamsBase} from '../getWorkspaceCollaborators/types';

export type CountWorkspaceCollaboratorsEndpointParams = GetWorkspaceCollaboratorsEndpointParamsBase;

export type CountWorkspaceCollaboratorsEndpoint = Endpoint<
  BaseContext,
  CountWorkspaceCollaboratorsEndpointParams,
  CountItemsEndpointResult
>;
