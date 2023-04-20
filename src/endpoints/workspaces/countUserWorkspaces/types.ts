import {BaseContext} from '../../contexts/types';
import {CountItemsEndpointResult, Endpoint} from '../../types';

export type CountUserWorkspacesEndpoint = Endpoint<BaseContext, {}, CountItemsEndpointResult>;
