import bridgeNetworks from "../../data/bridgeNetworkData";
import { sql } from "../../utils/db";
import { runAdapterToCurrentBlock } from "../../utils/adapter";

export const runAllAdapters = async () => {
  const lastRecordedBlocks = await sql`SELECT jsonb_object_agg(bridge_id::text, subresult) as result
  FROM (
      SELECT bridge_id, jsonb_build_object('startBlock', MIN(tx_block), 'endBlock', MAX(tx_block)) as subresult
      FROM bridges.transactions
      WHERE origin_chain IS NULL
      GROUP BY bridge_id
  ) subquery;
  `;
  try {
    console.log("Stored last recorded blocks");
  } catch (e) {
    console.error("Failed to store last recorded blocks");
    console.error(e);
  }

  await Promise.all(
    bridgeNetworks.map(async (adapter) => {
      try {
        await runAdapterToCurrentBlock(adapter, true, "upsert", lastRecordedBlocks[0].result);
      } catch (e) {
        console.error(`Failed to run adapter ${adapter.bridgeDbName}`);
        console.error(e);
      }
    })
  );
};
