import React, { useState } from "react";
import { format, subDays } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import { useAppStore } from "../store";
import { SectionHeader } from "../components/ui/Card";
import { formatDuration } from "../utils/time";
import type { TaskCategory } from "../types";

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  Routine: "#ffffff",
  Learning: "#a0a0a0",
  Work: "#606060",
  "Interview Prep": "#303030",
};

const WEEK_DAYS = 7;

export function AnalyticsPage() {
  const getDayStats = useAppStore((s) => s.getDayStats);
  const getTasksByDate = useAppStore((s) => s.getTasksByDate);

  // Build 7-day data
  const weekData = Array.from({ length: WEEK_DAYS }, (_, i) => {
    const date = format(subDays(new Date(), WEEK_DAYS - 1 - i), "yyyy-MM-dd");
    const label =
      i === WEEK_DAYS - 1
        ? "Today"
        : format(subDays(new Date(), WEEK_DAYS - 1 - i), "EEE");
    const stats = getDayStats(date);
    return {
      date,
      label,
      productive: stats.productive,
      wasted: stats.wasted,
      completed: stats.completed,
      missed: stats.missed,
      total: stats.total,
    };
  });

  // Category breakdown across 7 days
  const categoryTotals: Record<TaskCategory, number> = {
    Routine: 0,
    Learning: 0,
    Work: 0,
    "Interview Prep": 0,
  };
  weekData.forEach(({ date }) => {
    const tasks = getTasksByDate(date);
    tasks
      .filter((t) => t.status === "done")
      .forEach((t) => {
        categoryTotals[t.category] += t.actualDuration || t.plannedDuration;
      });
  });

  const pieData = Object.entries(categoryTotals)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const totalProductive = weekData.reduce((s, d) => s + d.productive, 0);
  const totalWasted = weekData.reduce((s, d) => s + d.wasted, 0);
  const totalCompleted = weekData.reduce((s, d) => s + d.completed, 0);
  const totalMissed = weekData.reduce((s, d) => s + d.missed, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-brand-dark border border-brand-border rounded-sm p-3 text-xs font-mono">
        <p className="text-brand-gray mb-1 tracking-wider">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="capitalize">
            {p.name}: {formatDuration(p.value)}
          </p>
        ))}
      </div>
    );
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-brand-dark border border-brand-border rounded-sm p-3 text-xs font-mono">
        <p className="text-white">{payload[0].name}</p>
        <p className="text-brand-gray">{formatDuration(payload[0].value)}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-brand-gray">
          Analytics
        </p>
        <h1 className="font-mono text-2xl text-white mt-0.5">7-Day Overview</h1>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          {
            label: "Productive",
            value: formatDuration(totalProductive),
            sub: "7 days total",
          },
          {
            label: "Wasted",
            value: formatDuration(totalWasted),
            sub: "Distractions",
          },
          { label: "Completed", value: totalCompleted, sub: "Tasks done" },
          { label: "Missed", value: totalMissed, sub: "Tasks missed" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-brand-card border border-brand-border rounded-sm p-4"
          >
            <p className="font-mono text-[9px] tracking-widest uppercase text-brand-gray mb-1">
              {s.label}
            </p>
            <p className="font-mono text-xl text-white font-bold">{s.value}</p>
            <p className="font-mono text-[9px] text-brand-muted mt-1">
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Bar chart — daily performance */}
      <div className="bg-brand-card border border-brand-border rounded-sm p-4">
        <SectionHeader
          title="Daily Performance"
          subtitle="Productive vs wasted time"
        />
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weekData} barGap={2} barCategoryGap="30%">
            <XAxis
              dataKey="label"
              tick={{
                fill: "#555",
                fontSize: 10,
                fontFamily: "Share Tech Mono",
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{
                fill: "#444",
                fontSize: 9,
                fontFamily: "Share Tech Mono",
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}m`}
              width={32}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <Bar
              dataKey="productive"
              name="productive"
              fill="#ffffff"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="wasted"
              name="wasted"
              fill="#333333"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 justify-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-white inline-block" />
            <span className="font-mono text-[10px] text-brand-gray">
              Productive
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-brand-muted inline-block" />
            <span className="font-mono text-[10px] text-brand-gray">
              Wasted
            </span>
          </div>
        </div>
      </div>

      {/* Line chart — progress trend */}
      <div className="bg-brand-card border border-brand-border rounded-sm p-4">
        <SectionHeader
          title="Progress Trend"
          subtitle="Tasks completed per day"
        />
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={weekData}>
            <CartesianGrid stroke="#1a1a1a" strokeDasharray="4 4" />
            <XAxis
              dataKey="label"
              tick={{
                fill: "#555",
                fontSize: 10,
                fontFamily: "Share Tech Mono",
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{
                fill: "#444",
                fontSize: 9,
                fontFamily: "Share Tech Mono",
              }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={24}
            />
            <Tooltip
              contentStyle={{
                background: "#0f0f0f",
                border: "1px solid #222",
                borderRadius: "2px",
                fontFamily: "Share Tech Mono",
                fontSize: "11px",
                color: "#fff",
              }}
              cursor={{ stroke: "#333" }}
            />
            <Line
              type="monotone"
              dataKey="completed"
              name="Completed"
              stroke="#ffffff"
              strokeWidth={2}
              dot={{ r: 3, fill: "#fff", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#fff" }}
            />
            <Line
              type="monotone"
              dataKey="missed"
              name="Missed"
              stroke="#444"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={{ r: 2, fill: "#444", strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie chart — category breakdown */}
      {pieData.length > 0 ? (
        <div className="bg-brand-card border border-brand-border rounded-sm p-4">
          <SectionHeader
            title="Category Breakdown"
            subtitle="Time distribution this week"
          />
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={CATEGORY_COLORS[entry.name as TaskCategory]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {pieData.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{
                        background: CATEGORY_COLORS[entry.name as TaskCategory],
                      }}
                    />
                    <span className="font-mono text-[10px] text-brand-gray truncate">
                      {entry.name}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-white">
                    {formatDuration(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-brand-card border border-brand-border rounded-sm p-8 text-center">
          <p className="font-mono text-brand-gray text-xs tracking-widest">
            NO DATA YET
          </p>
          <p className="text-brand-muted text-sm mt-2">
            Complete tasks to see category breakdown.
          </p>
        </div>
      )}

      {/* Efficiency ratio */}
      {totalProductive + totalWasted > 0 && (
        <div className="bg-brand-card border border-brand-border rounded-sm p-4">
          <SectionHeader title="Efficiency Ratio" />
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-brand-border rounded-sm overflow-hidden flex">
              <div
                className="h-full bg-white transition-all"
                style={{
                  width: `${(totalProductive / (totalProductive + totalWasted)) * 100}%`,
                }}
              />
            </div>
            <span className="font-mono text-sm text-white flex-shrink-0">
              {Math.round(
                (totalProductive / (totalProductive + totalWasted)) * 100,
              )}
              %
            </span>
          </div>
          <div className="flex justify-between mt-2 font-mono text-[10px] text-brand-gray">
            <span>Productive</span>
            <span>Wasted</span>
          </div>
        </div>
      )}
    </div>
  );
}
