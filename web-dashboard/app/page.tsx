"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type OrderRow = {
  id: number;
  total_sum: number | null;
  created_at: string | null;
};

type ChartPoint = {
  id: number;
  total_sum: number;
  dateLabel: string;
  created_at: string;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
);

export default function HomePage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("id, total_sum, created_at")
        .order("created_at", { ascending: true });

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("Supabase error:", error.message);
        setOrders([]);
      } else {
        setOrders(data ?? []);
      }

      setIsLoading(false);
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const chartData = useMemo<ChartPoint[]>(() => {
    return orders
      .filter((order) => order.created_at)
      .map((order) => ({
        id: order.id,
        total_sum: Number(order.total_sum ?? 0),
        created_at: order.created_at ?? "",
        dateLabel: format(new Date(order.created_at as string), "dd.MM.yyyy"),
      }));
  }, [orders]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Аналитика заказов
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Данные по суммам заказов с ростом по времени.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center text-sm text-slate-500">
              Загрузка данных...
            </div>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: 8, right: 16 }}>
                  <defs>
                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="dateLabel"
                    tickMargin={8}
                    stroke="#94a3b8"
                    fontSize={12}
                  />
                  <YAxis
                    tickMargin={8}
                    stroke="#94a3b8"
                    fontSize={12}
                    width={60}
                  />
                  <Tooltip
                    cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
                    contentStyle={{
                      borderRadius: 12,
                      borderColor: "#e2e8f0",
                      backgroundColor: "#ffffff",
                    }}
                    labelStyle={{ color: "#64748b" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_sum"
                    stroke="#0f766e"
                    strokeWidth={2}
                    fill="url(#ordersGradient)"
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
