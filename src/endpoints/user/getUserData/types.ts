import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicUserData} from '../types';

export interface IGetUserDataResult {
    user: IPublicUserData;
}

export type GetUserDataEndpoint = Endpoint<
    IBaseContext,
    undefined,
    IGetUserDataResult
>;
