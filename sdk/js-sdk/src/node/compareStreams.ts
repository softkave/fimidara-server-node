import {Readable} from 'stream';

export async function compareStreams(
  stream1: Readable,
  stream2: Readable
): Promise<{
  areEqual: boolean;
  position?: number;
  chunk1?: Buffer;
  chunk2?: Buffer;
}> {
  let position = 0;

  // Create async iterators for both streams
  const iterator1 = stream1[Symbol.asyncIterator]();
  const iterator2 = stream2[Symbol.asyncIterator]();

  while (true) {
    // Read chunks from both streams simultaneously
    const [chunk1Result, chunk2Result] = await Promise.all([
      iterator1.next(),
      iterator2.next(),
    ]);

    const chunk1 = chunk1Result.value;
    const chunk2 = chunk2Result.value;

    // If both streams are done, they're equal
    if (chunk1Result.done && chunk2Result.done) {
      return {areEqual: true};
    }

    // If one stream is done but the other isn't, they're different
    if (chunk1Result.done || chunk2Result.done) {
      return {
        areEqual: false,
        position,
        chunk1: chunk1 || null,
        chunk2: chunk2 || null,
      };
    }

    // Compare the chunks
    if (!chunk1.equals(chunk2)) {
      return {
        areEqual: false,
        position,
        chunk1,
        chunk2,
      };
    }

    position += chunk1.length;
  }
}
