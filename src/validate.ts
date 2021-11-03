import {
  ListenFunctionObservable,
  ValidateFunctionSubscriber,
} from "@kyve/core/dist/src/faces";
import axios from "axios";
import hash from "object-hash";
import { Logger } from "tslog";
import { ConfigType } from "./faces";

const validateFunction = (
  listener: ListenFunctionObservable,
  subscriber: ValidateFunctionSubscriber,
  config: ConfigType,
  logger: Logger
) => {
  logger.getChildLogger({
    name: "Cosmos",
  });

  // Subscribe to the listener.
  listener.subscribe(async (res) => {
    for (const item of res.bundle) {
      const height = (item.tags || []).find((tag) => tag.name === "Height")
        ?.value!;

      logger.debug(`Found block. Height = ${height}`);

      const { data } = await axios.get(`${config.rpc}/block?height=${height}`);

      // @ts-ignore
      const localHash = hash(JSON.parse(JSON.stringify(data.result)));
      const uploaderHash = hash(JSON.parse(item.data));

      if (localHash !== uploaderHash) {
        subscriber.next({
          transaction: res.transaction,
          valid: false,
        });
        return;
      }
    }

    subscriber.next({
      transaction: res.transaction,
      valid: true,
    });
  });
};

export default validateFunction;
