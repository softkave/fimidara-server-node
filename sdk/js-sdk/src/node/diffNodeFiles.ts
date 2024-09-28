import {diffFiles} from '../diff/diffFiles.js';
import {File as FimidaraFile} from '../endpoints/publicTypes.js';
import {getNodeDirContent} from './getNodeDirContent.js';

function isExistingDirContent(
  props: Partial<Awaited<ReturnType<typeof getNodeDirContent>>>
): props is Awaited<ReturnType<typeof getNodeDirContent>> {
  return !!(
    props.externalFilesRecord &&
    props.fileStatsRecord &&
    props.folderStatsRecord
  );
}

export async function diffNodeFiles<
  TFimidaraFile extends Pick<
    FimidaraFile,
    'name' | 'ext' | 'lastUpdatedAt'
  > = Pick<FimidaraFile, 'name' | 'ext' | 'lastUpdatedAt'>
>(
  props: {
    folderpath: string;
    fimidaraFiles: TFimidaraFile[] | Record<string, TFimidaraFile>;
  } & Partial<Awaited<ReturnType<typeof getNodeDirContent>>>
) {
  const {folderpath, fimidaraFiles} = props;
  const dirContent = isExistingDirContent(props)
    ? props
    : await getNodeDirContent({folderpath});

  const diffResult = diffFiles({
    fimidaraFiles,
    externalFiles: dirContent.externalFilesRecord,
  });

  return {...dirContent, ...diffResult};
}
