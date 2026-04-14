require("dotenv").config();

const axios = require("axios");
const fs = require("fs/promises");
const path = require("path");

const { RETAILCRM_URL, RETAILCRM_API_KEY } = process.env;
const ORDERS_FILE_PATH = path.join(__dirname, "mock_orders.json");
const REQUEST_DELAY_MS = 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getOrderLabel(order, index) {
  return order.number ?? order.externalId ?? order.id ?? index + 1;
}

function formatError(error) {
  if (axios.isAxiosError(error)) {
    const { response } = error;
    const data = response?.data;

    if (typeof data?.errorMsg === "string" && data.errorMsg.trim()) {
      return data.errorMsg;
    }

    if (data?.errors) {
      return typeof data.errors === "string"
        ? data.errors
        : JSON.stringify(data.errors);
    }

    if (response?.status) {
      return `HTTP ${response.status}: ${response.statusText || error.message}`;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function loadOrders() {
  const fileContents = await fs.readFile(ORDERS_FILE_PATH, "utf8");
  const parsedOrders = JSON.parse(fileContents);

  if (!Array.isArray(parsedOrders)) {
    throw new Error("Файл mock_orders.json должен содержать массив заказов.");
  }

  return parsedOrders;
}

async function main() {
  if (!RETAILCRM_URL || !RETAILCRM_API_KEY) {
    throw new Error(
      "Не заданы RETAILCRM_URL и/или RETAILCRM_API_KEY в файле .env.",
    );
  }

  const orders = await loadOrders();
  const endpoint = `${RETAILCRM_URL.replace(/\/+$/, "")}/api/v5/orders/create`;

  for (const [index, order] of orders.entries()) {
    const orderLabel = getOrderLabel(order, index);
    delete order.orderType;
    delete order.orderMethod;
    const body = new URLSearchParams();
    body.append("apiKey", RETAILCRM_API_KEY);
    body.append("order", JSON.stringify(order));

    try {
      const response = await axios.post(endpoint, body, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (response.data?.success) {
        console.log(`Заказ ${orderLabel}: успех`);
      } else {
        const apiError =
          response.data?.errorMsg ||
          (response.data?.errors
            ? JSON.stringify(response.data.errors)
            : "Неизвестная ошибка RetailCRM");

        console.log(`Заказ ${orderLabel}: ${apiError}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        console.log(`Заказ ${orderLabel}:`, error.response.data);
      }
      console.log(`Заказ ${orderLabel}: ${formatError(error)}`);
    }

    await sleep(REQUEST_DELAY_MS);
  }
}

main().catch((error) => {
  console.error(`Скрипт завершился с ошибкой: ${formatError(error)}`);
  process.exit(1);
});
