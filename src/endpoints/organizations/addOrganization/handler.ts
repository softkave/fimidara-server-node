import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {organizationExtractor} from '../utils';
import {AddOrganizationEndpoint} from './types';
import {addOrganizationJoiSchema} from './validation';

// async function createDefaultEnvironment(
//   context: IBaseContext,
//   reqData: RequestData,
//   organization: IOrganization
// ) {
//   const addEnvReqData = RequestData.clone(reqData);
//   const addEnvParams: IAddEnvironmentParams = {
//     environment: {
//       name: environmentConstants.defaultEnvironmentName,
//       organizationId: organization.organizationId,
//       description: environmentConstants.defaultEnvironmentDescription,
//     },
//   };

//   addEnvReqData.data = addEnvParams;
//   await addEnvironment(context, addEnvReqData);
// }

const addOrganization: AddOrganizationEndpoint = async (context, instData) => {
  const data = validate(instData.data, addOrganizationJoiSchema);
  const user = await context.session.getUser(context, instData);
  const organization = await context.data.organization.saveItem({
    createdAt: getDateString(),
    createdBy: user.userId,
    name: data.organization.name,
    organizationId: getNewId(),
    description: data.organization.description,
  });

  return {
    organization: organizationExtractor(organization),
  };
};

export default addOrganization;
