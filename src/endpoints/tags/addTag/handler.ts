import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeOrgPermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkOrganizationExistsWithAgent} from '../../organizations/utils';
import {AddTagEndpoint} from './types';
import {addTagJoiSchema} from './validation';
import {tagExtractor} from '../utils';
import {checkTagNameExists} from '../checkTagNameExists';

const addTag: AddTagEndpoint = async (context, instData) => {
  const data = validate(instData.data, addTagJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organization = await checkOrganizationExistsWithAgent(
    context,
    agent,
    data.organizationId
  );

  await checkAuthorization({
    context,
    agent,
    organization,
    type: AppResourceType.Tag,
    permissionOwners: makeOrgPermissionOwnerList(organization.resourceId),
    action: BasicCRUDActions.Create,
  });

  await checkTagNameExists(context, organization.resourceId, data.tag.name);
  let tag = await context.data.tag.saveItem({
    ...data.tag,
    organizationId: organization.resourceId,
    resourceId: getNewId(),
    createdAt: getDateString(),
    createdBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
  });

  return {
    tag: tagExtractor(tag),
  };
};

export default addTag;
