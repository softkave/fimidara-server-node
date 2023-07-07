import {css, cx} from '@emotion/css';
import React from 'react';
import {FimidaraEndpoints} from '../../../src';
import {
  ITestVars,
  generateTestFolderpath,
  getTestVars,
  indexArray,
} from '../../../src/testutils/utils';
import {IInternalTestItem, ITestController} from '../types';

export interface IUploadFileTestProps {
  controller: ITestController;
  test: IInternalTestItem;
  className?: string;
  style?: React.CSSProperties;
}

const vars: ITestVars = getTestVars();
const fimidara = new FimidaraEndpoints({authToken: vars.authToken});
const kMaxProgressBarWidth = 200;
const classes = {
  root: css({display: 'flex', flexDirection: 'column', columnGap: '16px'}),
  fileItem: {
    root: css({
      display: 'flex',
      flexDirection: 'column',
      columnGap: '4px',
      color: 'grey',
    }),
    progressBar: css({
      maxWidth: kMaxProgressBarWidth,
      borderColor: 'lightgreen',
      borderStyle: 'solid',
      borderTopWidth: '5px',
    }),
    error: css({color: 'red'}),
  },
};

const UploadFileTest: React.FC<IUploadFileTestProps> = props => {
  const {controller, test, className, style} = props;
  const [folderpath] = React.useState(() => generateTestFolderpath(vars));
  const [fileList, setFileList] = React.useState<File[]>([]);
  const [completedList, setCompletedList] = React.useState<boolean[]>([]);
  const [errorList, setErrorList] = React.useState<unknown[]>([]);

  const handleSelectFile: React.ChangeEventHandler<HTMLInputElement> = evt => {
    controller.setPending(test.name);
    const evtFileList = evt.target.files;

    if (evtFileList) {
      setFileList(presentFileList => {
        const presentFilesMap = indexArray(presentFileList, {path: 'name'});
        return presentFileList.concat(
          Array.from(evtFileList).filter(file => !presentFilesMap[file.name])
        );
      });
    }
  };

  const handleError = (index: number, error: unknown) => {
    setErrorList(errorList => {
      const newErrorList = [...errorList];
      newErrorList[index] = error;
      return newErrorList;
    });
  };

  const handleCompleted = (index: number) => {
    const newCompletedList = [...completedList];
    newCompletedList[index] = true;
    setCompletedList(newCompletedList);

    if (newCompletedList.length === fileList.length) {
      if (errorList.length > 0) {
        controller.setFailed(test.name, errorList.map(String).join('\n\n'));
      } else {
        controller.setSuccess(test.name);
      }
    }
  };

  return (
    <div className={cx(classes.root, className)} style={style}>
      <input type="file" onChange={handleSelectFile} />
      {fileList.map((file, index) => (
        <UploadingFileItem
          key={file.name}
          folderpath={folderpath}
          file={file}
          onComplete={() => handleCompleted(index)}
          onError={error => handleError(index, error)}
        />
      ))}
    </div>
  );
};

export interface IUploadingFileItemProps {
  folderpath: string;
  file: File;
  onError: (errror: unknown) => void;
  onComplete: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const UploadingFileItem: React.FC<IUploadingFileItemProps> = props => {
  const {file, folderpath, className, style, onError, onComplete} = props;
  const [uploadProgress, setUploadProgress] = React.useState<{
    total?: number;
    progress?: number;
  }>({});

  // TODO: any way to move this up instead of handled locally?
  const [error, setError] = React.useState<unknown>();

  const uploadFile = React.useCallback(async () => {
    try {
      const filepath = `${folderpath}/${file.name}`;
      const result = await fimidara.files.uploadFile({
        body: {filepath, data: file.stream()},
        onUploadProgress(progressEvent) {
          setUploadProgress({
            total: progressEvent.total,
            progress: progressEvent.progress,
          });
        },
      });
    } catch (error: unknown) {
      setError(error);
      onError(error);
    } finally {
      onComplete();
    }
  }, [file, folderpath]);

  React.useEffect(() => {
    uploadFile();
  }, [uploadFile]);

  const total = uploadProgress.total ?? 0;
  const progress = uploadProgress.progress ?? 0;
  let progressBarWidth = 0;

  if (total > 0) {
    progressBarWidth = (progress / total) * kMaxProgressBarWidth;
  }

  const errorNode = error ? (
    <div className={classes.fileItem.error}>{String(error)}</div>
  ) : null;

  return (
    <div className={cx(classes.fileItem.root, className)} style={style}>
      {errorNode}
      <div>{file.name}</div>
      <div
        style={{width: progressBarWidth}}
        className={classes.fileItem.progressBar}
      />
      <div>
        {progress} of {total} uploaded
      </div>
    </div>
  );
};

export default UploadFileTest;
