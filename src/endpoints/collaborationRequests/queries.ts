import {ICollaborationRequest} from '../../definitions/collaborationRequest';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<ICollaborationRequest>();
}

function getByWorkspaceIdAndUserEmail(workspaceId: string, userEmail: string) {
  return newFilter()
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
    .addItem('recipientEmail', new RegExp(`^${userEmail}$`, 'i'), DataProviderFilterValueOperator.Regex)
    .build();
}

function getByUserEmail(userEmail: string) {
  return newFilter()
    .addItem('recipientEmail', new RegExp(`^${userEmail}$`, 'i'), DataProviderFilterValueOperator.Regex)
    .build();
}

export default abstract class CollaborationRequestQueries {
  static getByUserEmail = getByUserEmail;
  static getByWorkspaceIdAndUserEmail = getByWorkspaceIdAndUserEmail;
}
