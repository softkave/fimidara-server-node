import {BaseContextType} from '../../contexts/types';
import {CountItemsEndpointResult, Endpoint} from '../../types';

export type CountUserWorkspacesEndpoint = Endpoint<BaseContextType, {}, CountItemsEndpointResult>;
