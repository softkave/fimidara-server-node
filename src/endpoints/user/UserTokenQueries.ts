import {IUserToken} from '../../definitions/userToken';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IUserToken>();
}

function getById(id: string) {
  return newFilter()
    .addItem('tokenId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class UserTokenQueries {
  static getById = getById;
}
