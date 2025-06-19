import React, { useEffect, useState } from "react";
import MUIDatePicker from "./DatePicker";
import Loader from "./Loader";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const CustomLineChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) {
        const parts = dateString.split(/[-/]/);
        if (parts.length === 3) {
          d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } else if (dateString.includes("T")) {
          d = new Date(dateString.split("T")[0]);
        }
      }
      if (isNaN(d.getTime())) return "Invalid Date";
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${year}-${month}-${day}`; // Changed to YYYY-MM-DD for API consistency
    } catch (error) {
      return "Invalid Date";
    }
  };

  const formatTooltipDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null); // Reset error state
      const token = localStorage.getItem("authorization");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const params = new URLSearchParams();
      if (period) params.append("period", period);
      if (startDate) params.append("start_date", formatDate(startDate));
      if (endDate) params.append("end_date", formatDate(endDate));

      const response = await fetch(
        `https://uatapi-pragati.nichetechqa.com/api/v1/dashboard/line-chart?${params.toString()}`,
        {
          method: "GET",
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
      const formatted =
        result?.data?.map((item) => ({
          date: formatDate(item.date),
          fullDate: item.date,
          balance: Number(item.closingBalance),
        })) || [];

      setData(formatted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="custom-tooltip"
          style={{
            backgroundColor: "#fff",
            padding: "10px",
            border: "1px solid #eee",
            borderRadius: "4px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ margin: 0, color: "#666", fontSize: "12px" }}>
            {formatTooltipDate(payload[0].payload.fullDate)}
          </p>
          <p
            style={{
              margin: "4px 0 0 0",
              color: "#00C2FF",
              fontWeight: "bold",
            }}
          >
            ₹{payload[0].value.toLocaleString("en-IN")}
          </p>
        </div>
      );
    }
    return null;
  };

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
              Daily Closing Balance Chart
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
              disabled={!!startDate || !!endDate}
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
              style={{ display: "flex", gap: "16px", alignItems: "flex-end" }}
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
                  disabled={!!period}
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
                  disabled={!!period || !startDate}
                  minDate={startDate}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="card-body" style={{ height: 400, padding: "20px" }}>
          {data.length === 0 ? (
            <div className="text-center">No Data Found</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
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
                  height={60}
                  tickMargin={15}
                  interval={Math.ceil(data.length / 12)}
                  tick={{ fontSize: 12, fill: "#666" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#666" }}
                  domain={["auto", "auto"]}
                  width={80}
                  tickCount={6}
                  tickFormatter={(value) => value.toLocaleString("en-IN")}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#00C2FF"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    stroke: "#00C2FF",
                    strokeWidth: 2,
                    fill: "#fff",
                  }}
                  activeDot={{ r: 6 }}
                  name="Daily Closing Balance"
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ paddingBottom: "20px" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomLineChart;