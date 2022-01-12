import {IUserOrganization} from '../../definitions/user';

export interface IPublicCollaborator {
  resourceId: string;
  firstName: string;
  lastName: string;
  email: string;
  organizations: IUserOrganization[];
}
