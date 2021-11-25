import {IUser} from '../../definitions/user';
import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {IPublicCollaborator} from './types';

const collaboratorFields = getFields<IPublicCollaborator>({});

export const collaboratorExtractor = makeExtract(collaboratorFields);
export const collaboratorListExtractor = makeListExtract(collaboratorFields);

export function getCollaboratorOrganization(
  user: IUser,
  organizationId: string
) {
  return user.organizations.find(
    item => item.organizationId === organizationId
  );
}
