import {
  FimdaraDeployOpLogEvent,
  FimidaraDeployOpLogItem,
  FimidaraDeployOpLogItemInput,
} from './types.js';

class FimidaraDeployOpLog {
  static symbols = {
    entryDelimiter: '\n',
    entryPartDelimiter: ',',
    messageStart: '"',
    messageEnd: '"',
    partLengthDelimiter: ':',
  } as const;

  constructor(protected filepath: string) {}

  async write(event: FimidaraDeployOpLogItemInput | FimidaraDeployOpLogItemInput[]) {}

  protected serializeItem(event: FimidaraDeployOpLogItemInput) {
    const entry = [
      this.serializePart(event.event),
      this.serializePart(Date.now().toString()),
      this.serializePart(event.message || ''),
    ].join(FimidaraDeployOpLog.symbols.entryPartDelimiter);
    return entry + FimidaraDeployOpLog.symbols.entryDelimiter;
  }

  protected serializePart(part: string) {
    return (
      part.length.toString() + FimidaraDeployOpLog.symbols.partLengthDelimiter + part
    );
  }

  protected deserializeItem(item: string): FimidaraDeployOpLogItem | null {
    const parts: string[] = [];
    let partStartIndex = 0;
    let part = this.deserializePart(item, partStartIndex);

    while (part) {
      parts.push(part.part);
      partStartIndex =
        part.endIndex + FimidaraDeployOpLog.symbols.entryPartDelimiter.length;
      part = this.deserializePart(item, partStartIndex);
    }

    const event = parts[0];
    const timestamp = Number(parts[1]);
    const message = parts[2];

    if (!event || Number.isNaN(timestamp)) {
      return null;
    }

    return {timestamp, message, event: event as FimdaraDeployOpLogEvent};
  }

  protected deserializePart(item: string, startIndex: number) {
    const partLengthDelimiterIndex = item.indexOf(
      FimidaraDeployOpLog.symbols.partLengthDelimiter,
      startIndex
    );

    if (partLengthDelimiterIndex === -1) {
      return null;
    }

    const strPartLength = item.slice(startIndex, partLengthDelimiterIndex);
    const pathLength = Number(strPartLength);

    if (Number.isNaN(pathLength)) {
      return null;
    }

    const partContentStartIndex = partLengthDelimiterIndex + 1;
    const partContentEndIndex = partContentStartIndex + pathLength;
    const part = item.slice(partContentStartIndex, partContentEndIndex);

    return {part, endIndex: partContentEndIndex};
  }
}
