import {IBaseContext} from '../../contexts/types';
import {Endpoint, ICountItemsEndpointResult} from '../../types';

export type CountUserWorkspacesEndpoint = Endpoint<IBaseContext, {}, ICountItemsEndpointResult>;
