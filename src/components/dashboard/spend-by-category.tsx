"use client";

import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Cell,
  Legend,
} from "recharts";
import { useCategories } from "@/components/categories-provider";
import { findCategory } from "@/lib/categories";
import { formatMoney } from "@/lib/currency-format";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function SpendByCategory({
  data,
  currency,
}: {
  data: Array<{ category: string; count: number; value: number }>;
  currency: string;
}) {
  const categories = useCategories();
  if (data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">
        Add a device to see category breakdown.
      </div>
    );
  }
  const chartData = data.map((d) => ({
    ...d,
    label: findCategory(d.category, categories).label,
  }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="label"
            innerRadius={56}
            outerRadius={92}
            paddingAngle={2}
            strokeWidth={2}
            stroke="var(--card)"
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              fontSize: 12,
            }}
            formatter={(value) => formatMoney(Number(value ?? 0), currency)}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            wrapperStyle={{ fontSize: 11 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
