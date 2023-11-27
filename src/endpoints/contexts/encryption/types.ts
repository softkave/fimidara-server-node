export interface EncryptedText {
  cipher: string;
  encryptedText: string;
}

export interface EncryptionProvider {
  encryptText: (text: string) => Promise<EncryptedText>;
  decryptText: (params: EncryptedText) => Promise<string>;
}
