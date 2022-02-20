export interface ISharedResource {
  // protected members. not for public use.
  refs: number;
  incrementRef: () => void;

  // public members
  cleanup(): Promise<void>;
  dispose: () => Promise<void>;
}

export default abstract class SharedResource {
  // protected members. not for public use.
  refs: number = 0;
  incrementRef() {
    this.refs++;
  }

  // public members
  abstract cleanup(): Promise<void>;
  async dispose() {
    this.refs--;

    if (this.refs === 0) {
      await this.cleanup();
    }
  }
}
