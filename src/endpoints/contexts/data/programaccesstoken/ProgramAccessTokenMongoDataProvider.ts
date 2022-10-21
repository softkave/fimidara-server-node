import {IProgramAccessToken} from '../../../../definitions/programAccessToken';
import {BaseMongoDataProvider} from '../utils';
import {IProgramAccessTokenDataProvider} from './type';

export class ProgramAccessTokenMongoDataProvider
  extends BaseMongoDataProvider<IProgramAccessToken>
  implements IProgramAccessTokenDataProvider {}
