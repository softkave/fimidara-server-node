import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {validate} from '../../../utils/validate.js';
import {prepareFileForUpload, prepareMultipart} from '../uploadFile/prepare.js';
import {fileExtractor} from '../utils.js';
import {CompleteMultipartUploadEndpoint} from './types.js';
import {completeMultipartUploadJoiSchema} from './validation.js';

const completeMultipartUpload: CompleteMultipartUploadEndpoint =
  async reqData => {
    const data = validate(reqData.data, completeMultipartUploadJoiSchema);
    const agent = await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );

    let {file} = await prepareFileForUpload(data, agent);
    file = await prepareMultipart({file, agent});

    return {file: fileExtractor(file)};
  };

export default completeMultipartUpload;
