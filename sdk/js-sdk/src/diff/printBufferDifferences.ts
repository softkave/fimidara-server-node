export function printBufferDifferences(
  buffer1: Buffer | Uint8Array,
  buffer2: Buffer | Uint8Array,
  maxPrintLength?: number
): string {
  const maxLength = Math.max(buffer1.length, buffer2.length);
  const lines: string[] = [];

  // Add header
  lines.push('Buffer Differences:');
  lines.push('Pos\tBuffer1\tBuffer2\tChar1\tChar2');
  lines.push('---\t-------\t-------\t-----\t-----');

  for (let i = 0; i < maxLength; i++) {
    const byte1 = buffer1[i];
    const byte2 = buffer2[i];

    if (byte1 !== byte2) {
      const char1 = byte1
        ? String.fromCharCode(byte1).replace(/[^\x20-\x7E]/g, '.')
        : '';
      const char2 = byte2
        ? String.fromCharCode(byte2).replace(/[^\x20-\x7E]/g, '.')
        : '';

      lines.push(
        `${i}\t${byte1?.toString(16)?.toUpperCase() ?? 'EOF'}\t${
          byte2?.toString(16)?.toUpperCase() ?? 'EOF'
        }\t${char1}\t${char2}`
      );

      if (maxPrintLength && lines.length > maxPrintLength) {
        lines.push('...');
        break;
      }
    }
  }

  if (lines.length === 3) {
    lines.push('No differences found.');
  }

  return lines.join('\n');
}
