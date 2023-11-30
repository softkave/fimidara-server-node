import sharp = require('sharp');
import stream = require('stream');
import {PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {isObjectFieldsEmpty} from '../../../utils/fns';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {validate} from '../../../utils/validate';
import {kSemanticModels} from '../../contexts/injectables';
import {getFileBackendForFile} from '../../fileBackends/mountUtils';
import {checkFileAuthorization03} from '../utils';
import {ReadFileEndpoint} from './types';
import {readFileJoiSchema} from './validation';

// TODO: implement accept ranges, cache control, etags, etc.
// see aws s3 sdk getObject function

const readFile: ReadFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, readFileJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);

  const file = await await kSemanticModels.utils().withTxn(async opts => {
    const {file} = await checkFileAuthorization03(
      agent,
      data,
      'readFile',
      /** support presigned path */ true,
      /** increment presigned path usage count */ true,
      opts
    );

    return file;
  });

  const {provider, preferredMountEntry} = await getFileBackendForFile(file);
  const persistedFile = await provider.readFile({
    filepath: preferredMountEntry.key,
  });

  if (!persistedFile.body) {
    throw kReuseableErrors.file.notFound();
  }

  const isImageResizeEmpty = isObjectFieldsEmpty(data.imageResize ?? {});
  if (!isImageResizeEmpty || data.imageFormat) {
    const outputStream = new stream.PassThrough();
    const transformer = sharp();

    if (data.imageResize && !isImageResizeEmpty) {
      transformer.resize({
        width: data.imageResize.width,
        height: data.imageResize.height,
        fit: data.imageResize.fit as any,
        position: data.imageResize.position,
        background: data.imageResize.background,
        withoutEnlargement: data.imageResize.withoutEnlargement,
      });
    }
    if (data.imageFormat) {
      transformer.toFormat(data.imageFormat);
    } else {
      transformer.toFormat('png');
    }

    persistedFile.body.pipe(transformer).pipe(outputStream);
    return {
      stream: outputStream,
      mimetype: 'image/png',
      contentLength: persistedFile.size,
    };
  } else {
    return {
      stream: persistedFile.body,
      mimetype: file.mimetype ?? 'application/octet-stream',
      contentLength: persistedFile.size,
    };
  }
};

export default readFile;
