import {ValueOf} from 'type-fest';
import {UploadFileEndpointParams} from '../../../files/uploadFile/types.js';
import {generateTestImage, IGenerateImageProps} from './generateTestImage.js';
import {
  generateTestTextFile,
  IGenerateTestTextFileParams,
} from './generateTestTextFile.js';

export const kGenerateTestFileType = {
  png: 'png',
  txt: 'txt',
} as const;

export type GenerateTestFileType = ValueOf<typeof kGenerateTestFileType>;

export async function generateTestFileBinary(props: {
  type?: GenerateTestFileType;
  imageProps?: IGenerateImageProps;
  textFileParams?: IGenerateTestTextFileParams;
}) {
  const {type = 'png', imageProps, textFileParams} = props;
  if (type === 'png') {
    const {dataBuffer, getStream} = await generateTestImage(imageProps);
    return {
      dataBuffer,
      getStream,
      getInput: (): Partial<UploadFileEndpointParams> => ({
        data: getStream(),
        mimetype: 'image/png',
        size: dataBuffer.byteLength,
      }),
    };
  } else {
    const {dataBuffer, getStream} = generateTestTextFile(textFileParams);
    return {
      dataBuffer,
      getStream,
      getInput: (): Partial<UploadFileEndpointParams> => ({
        data: getStream(),
        mimetype: 'text/plain',
        size: dataBuffer.byteLength,
        encoding: 'utf-8',
      }),
    };
  }
}
