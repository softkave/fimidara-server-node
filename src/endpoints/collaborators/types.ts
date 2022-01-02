import {IUserOrganization} from '../../definitions/user';

export interface IPublicCollaborator {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  organizations: IUserOrganization[];
}
