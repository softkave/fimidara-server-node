import {DataProviderFilterValueOperator} from '../../contexts/data/DataProvider.js';
import DataProviderFilterBuilder from '../../contexts/data/DataProviderFilterBuilder.js';
import {User} from '../../definitions/user.js';

function newFilter() {
  return new DataProviderFilterBuilder<User>();
}

function getByUserEmail(userEmail: string) {
  return newFilter()
    .addItem(
      'email',
      new RegExp(`^${userEmail}$`, 'i'),
      DataProviderFilterValueOperator.Regex
    )
    .build();
}

export default abstract class CollaboratorQueries {
  static getByUserEmail = getByUserEmail;
}
