import axios from "axios";

export class Provider {
  endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  public async fetchBlock(height: number) {
    while (true) {
      try {
        const { data } = await axios.get(
          `${this.endpoint}/block?height=${height}`
        );
        return data.result.block;
      } catch {}
    }
  }

  public async fetchCurrentHeight(): Promise<number> {
    while (true) {
      try {
        const { data } = await axios.get(`${this.endpoint}/status`);
        return data.result.sync_info.latest_block_height;
      } catch {}
    }
  }
}
