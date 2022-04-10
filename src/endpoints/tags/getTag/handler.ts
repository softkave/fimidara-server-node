import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {checkTagAuthorization02, tagExtractor} from '../utils';
import {GetTagEndpoint} from './types';
import {getTagJoiSchema} from './validation';

const getTag: GetTagEndpoint = async (context, instData) => {
  const data = validate(instData.data, getTagJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {tag} = await checkTagAuthorization02(
    context,
    agent,
    data.tagId,
    BasicCRUDActions.Read
  );

  return {
    tag: tagExtractor(tag),
  };
};

export default getTag;
