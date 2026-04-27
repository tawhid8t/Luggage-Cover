'use client';

import { useState, useEffect, useCallback } from "react";

export type DatePeriod = "today" | "yesterday" | "week" | "month" | "quarter" | "year" | "all" | "custom";

interface DateFilterProps {
  period: DatePeriod;
  onPeriodChange: (period: DatePeriod, startDate?: string, endDate?: string) => void;
  loading?: boolean;
}

const PERIODS: { value: DatePeriod; label: string; short: string }[] = [
  { value: "today", label: "Today", short: "Day" },
  { value: "yesterday", label: "Yesterday", short: "YDay" },
  { value: "week", label: "Last 7 Days", short: "7D" },
  { value: "month", label: "This Month", short: "M" },
  { value: "quarter", label: "This Quarter", short: "Q" },
  { value: "year", label: "This Year", short: "Y" },
  { value: "all", label: "All Time", short: "All" },
  { value: "custom", label: "Custom Range", short: "📅" },
];

export default function DateFilter({ period, onPeriodChange, loading }: DateFilterProps) {
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustom, setShowCustom] = useState(period === "custom");

  useEffect(() => {
    setShowCustom(period === "custom");
  }, [period]);

  const handlePeriodSelect = useCallback((p: DatePeriod) => {
    if (p === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    onPeriodChange(p);
  }, [onPeriodChange]);

  const handleCustomApply = useCallback(() => {
    if (customStart && customEnd) {
      onPeriodChange("custom", customStart, customEnd);
    }
  }, [customStart, customEnd, onPeriodChange]);

  // Get date range display
  const getDateRangeDisplay = () => {
    if (period === "custom" && customStart && customEnd) {
      return `${formatDate(customStart)} - ${formatDate(customEnd)}`;
    }
    const p = PERIODS.find(p => p.value === period);
    return p?.label || "Select";
  };

  return (
    <div className="date-filter">
      <div className="date-filter-main">
        <div className="date-filter-periods">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              className={`date-filter-btn ${period === p.value ? "active" : ""}`}
              onClick={() => handlePeriodSelect(p.value)}
              disabled={loading}
            >
              {p.short}
            </button>
          ))}
        </div>
        <div className="date-filter-display">
          <i className="fas fa-calendar-alt"></i>
          <span>{getDateRangeDisplay()}</span>
        </div>
      </div>

      {showCustom && (
        <div className="date-filter-custom">
          <div className="date-filter-custom-row">
            <div className="date-filter-input-wrap">
              <label>Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="admin-input"
              />
            </div>
            <div className="date-filter-input-wrap">
              <label>End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="admin-input"
              />
            </div>
            <button
              className="admin-btn admin-btn-primary"
              onClick={handleCustomApply}
              disabled={!customStart || !customEnd || loading}
            >
              {loading ? "Loading..." : "Apply"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-BD", { month: "short", day: "numeric" });
}

// Utility function to get human-readable period
export function getPeriodLabel(period: DatePeriod): string {
  const p = PERIODS.find(p => p.value === period);
  return p?.label || period;
}