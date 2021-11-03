import { UploadFunctionSubscriber } from "@kyve/core/dist/src/faces";
import axios from "axios";
import { Logger } from "tslog";
import WebSocket from "ws";
import { ConfigType } from "./faces";

const uploadFunction = (
  subscriber: UploadFunctionSubscriber,
  config: ConfigType,
  logger: Logger
) => {
  logger = logger.getChildLogger({
    name: "Cosmos",
  });

  const main = () => {
    // Connect to the WebSocket endpoint.
    const client = new WebSocket(`${config.wss}/websocket`);
    client.on("open", () => {
      logger.info(`✅ Connection created. Endpoint = ${config.wss}`);

      // Subscribe to new blocks.
      client.send(
        JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          method: "subscribe",
          params: ["tm.event='NewBlock'"],
        })
      );
    });

    // Listen for hangups, and restart the connection.
    client.on("close", () => {
      logger.info("❎ Connection closed. Retrying ...");
      client.terminate();

      main();
    });

    // Subscribe to new blocks.
    client.on("message", async (data) => {
      const { result } = JSON.parse(data.toString());
      if (result.query !== "tm.event='NewBlock'") return;

      const height = result.data.value.block.header.height;
      logger.info(`🆕 Received a new block. Height = ${height}`);

      const res = await axios.get(`${config.rpc}/block?height=${height}`);

      const tags = [
        // @ts-ignore
        { name: "Block", value: res.data.result.block_id.hash },
        { name: "Height", value: height },
      ];

      // @ts-ignore
      subscriber.next({ data: JSON.stringify(res.data.result), tags });
    });
  };

  main();
};

export default uploadFunction;
