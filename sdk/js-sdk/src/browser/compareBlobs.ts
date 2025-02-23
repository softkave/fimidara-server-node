export async function compareBlobs(
  blob1: Blob,
  blob2: Blob
): Promise<{
  areEqual: boolean;
  position?: number;
  chunk1?: Uint8Array;
  chunk2?: Uint8Array;
}> {
  // If sizes are different, blobs are not equal
  if (blob1.size !== blob2.size) {
    return {
      areEqual: false,
      position: Math.min(blob1.size, blob2.size),
      chunk1: new Uint8Array(await blob1.slice(0, 1024).arrayBuffer()),
      chunk2: new Uint8Array(await blob2.slice(0, 1024).arrayBuffer()),
    };
  }

  const CHUNK_SIZE = 1024 * 8; // 8KB chunks
  let position = 0;

  while (position < blob1.size) {
    const remainingBytes = blob1.size - position;
    const bytesToRead = Math.min(CHUNK_SIZE, remainingBytes);

    const chunk1 = new Uint8Array(
      await blob1.slice(position, position + bytesToRead).arrayBuffer()
    );
    const chunk2 = new Uint8Array(
      await blob2.slice(position, position + bytesToRead).arrayBuffer()
    );

    // Compare the chunks
    if (chunk1.length !== chunk2.length) {
      return {
        areEqual: false,
        position,
        chunk1,
        chunk2,
      };
    }

    for (let i = 0; i < chunk1.length; i++) {
      if (chunk1[i] !== chunk2[i]) {
        return {
          areEqual: false,
          position: position + i,
          chunk1,
          chunk2,
        };
      }
    }

    position += bytesToRead;
  }

  return {areEqual: true};
}
