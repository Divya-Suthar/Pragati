import React, { useEffect, useState } from "react";
import MUIDatePicker from "./DatePicker";
import Loader from "./Loader"; // Import the reusable Loader
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const IncomeExpenseChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hiddenBars, setHiddenBars] = useState([]);

  const formatDateForApi = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null); // Reset error state
      const token = localStorage.getItem("authorization");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const params = new URLSearchParams();
      if (period) params.append("period", period);
      if (startDate) params.append("start_date", formatDateForApi(startDate));
      if (endDate) params.append("end_date", formatDateForApi(endDate));

      const response = await fetch(
        `https://uatapi-pragati.nichetechqa.com/api/v1/dashboard/dashboard-transaction?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const apiData =
        result?.data ||
        result?.transactions ||
        result?.result ||
        (Array.isArray(result) ? result : []);
      const formatted = apiData?.map((item) => ({
        date: item.date,
        income: item.total_income || item.income || 0,
        expense: item.total_expense || item.expense || 0,
      })) || [];

      setData(formatted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [period, startDate, endDate]);

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
    if (e.target.value) {
      setStartDate("");
      setEndDate("");
    }
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    setPeriod("");
    if (!date) {
      setEndDate("");
    }
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  const handleLegendClick = (dataKey) => {
    setHiddenBars((prev) =>
      prev.includes(dataKey)
        ? prev.filter((bar) => bar !== dataKey)
        : [...prev, dataKey]
    );
  };

  const renderCustomizedLegend = () => {
    const legendEntries = [
      { dataKey: "income", value: "Total Income", color: "#3399FF" },
      { dataKey: "expense", value: "Total Expense", color: "#FF6B6B" },
    ];

    return (
      <div
        style={{
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          paddingTop: "20px",
          paddingBottom: "10px",
          backgroundColor: "#f9f9f9",
          borderRadius: "4px",
        }}
      >
        {legendEntries.map((entry, index) => {
          const { value, color, dataKey } = entry;
          const isHidden = hiddenBars.includes(dataKey);

          return (
            <div
              key={`legend-${index}`}
              style={{ display: "flex", alignItems: "center" }}
            >
              <input
                type="checkbox"
                checked={!isHidden}
                onChange={() => handleLegendClick(dataKey)}
                style={{
                  marginRight: "5px",
                  cursor: "pointer",
                  accentColor: color,
                }}
              />
              <span style={{ color, fontSize: "14px" }}>{value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const isPeriodDisabled = !!startDate || !!endDate;
  const isStartDateDisabled = !!period;
  const isEndDateDisabled = !!period || !startDate;

  if (loading) return <Loader />;
  if (error) return <div className="text-danger text-center">Error: {error}</div>;

  return (
    <div className="col-xl-12">
      <div className="card custom-card">
        <div className="d-flex" style={{ padding: "20px 20px 0" }}>
          <div className="card-header justify-content-between">
            <div
              className="card-title"
              style={{
                marginRight: "150px",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              Income and Expense Chart
            </div>
          </div>
          <div className="me-3">
            <label
              className="form-label"
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                color: "#555",
              }}
            >
              Period
            </label>
            <select
              className="form-select form-select-lg"
              value={period}
              onChange={handlePeriodChange}
              disabled={isPeriodDisabled}
              style={{
                width: "150px",
                padding: "8px 12px",
                borderRadius: "4px",
                border: "1px solid #ddd",
              }}
            >
              <option value="">Select</option>
              <option value="today">Today</option>
              <option value="last_week">Last 7 Days</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
            </select>
          </div>
          <div>
            <div
              style={{
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
                alignItems: "flex-end",
              }}
            >
              <div style={{ width: "200px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    color: "#555",
                  }}
                >
                  Start
                </label>
                <MUIDatePicker
                  selectedDate={startDate}
                  onChange={handleStartDateChange}
                  disabled={isStartDateDisabled}
                />
              </div>
              <div style={{ width: "200px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    color: "#555",
                  }}
                >
                  End
                </label>
                <MUIDatePicker
                  selectedDate={endDate}
                  onChange={handleEndDateChange}
                  disabled={isEndDateDisabled}
                  minDate={startDate}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="card-body" style={{ height: 400 }}>
          {data.length === 0 ? (
            <div className="text-center">No Data Found</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12, fill: "#666" }}
                />
                <YAxis
                  tickFormatter={(val) => val.toLocaleString("en-IN")}
                  tick={{ fontSize: 12, fill: "#666" }}
                  label={{
                    value: "Amount",
                    angle: -90,
                    position: "insideLeft",
                    offset: -5,
                    fontSize: 14,
                    fill: "#666",
                  }}
                />
                <Tooltip formatter={(val) => val.toLocaleString("en-IN")} />
                <Legend content={renderCustomizedLegend} />
                {!hiddenBars.includes("income") && (
                  <Bar dataKey="income" name="Total Income" fill="#3399FF" />
                )}
                {!hiddenBars.includes("expense") && (
                  <Bar dataKey="expense" name="Total Expense" fill="#FF6B6B" />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncomeExpenseChart;