require("dotenv").config();

const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

const {
  RETAILCRM_URL,
  RETAILCRM_API_KEY,
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
} = process.env;

const RETAILCRM_LIMIT = 100;

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
}

async function fetchOrders() {
  const endpoint = `${RETAILCRM_URL.replace(/\/+$/, "")}/api/v5/orders`;
  const response = await axios.get(endpoint, {
    params: {
      apiKey: RETAILCRM_API_KEY,
      limit: RETAILCRM_LIMIT,
    },
  });

  return response.data?.orders ?? [];
}

function mapOrdersForDb(orders) {
  return orders.map((order) => ({
    id: order.id,
    total_sum: order.totalSumm,
    created_at: order.createdAt,
  }));
}

async function main() {
  requireEnv("RETAILCRM_URL", RETAILCRM_URL);
  requireEnv("RETAILCRM_API_KEY", RETAILCRM_API_KEY);
  requireEnv("SUPABASE_URL", SUPABASE_URL);
  requireEnv("SUPABASE_SERVICE_KEY", SUPABASE_SERVICE_KEY);

  const orders = await fetchOrders();
  const payload = mapOrdersForDb(orders);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { error } = await supabase.from("orders").upsert(payload);

  if (error) {
    console.error("Supabase upsert error:", error.message ?? error);
    return;
  }

  console.log(`Upsert successful. Rows: ${payload.length}`);
}

main().catch((error) => {
  console.error("Sync failed:", error.message ?? error);
  process.exit(1);
});
