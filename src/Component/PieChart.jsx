import React, { useEffect, useState } from "react";
import MUIDatePicker from "./DatePicker";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import Loader from "./Loader"; 

const COLORS = ["#8c85ff", "#ff8000", "#7ed6a6", "#822c3f"];

const CustomPieChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
        `https://uatapi-pragati.nichetechqa.com/api/v1/dashboard/dashboard-expense?${params.toString()}`,
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
      const formattedData = result.data.data.map((item) => ({
        name: item.name || item.category,
        value: item.total_amount || item.amount,
      }));

      setData(formattedData || []);
    } catch (error) {
      setError(error.message);
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
    if (!date) {
      setEndDate("");
    }
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  const isPeriodDisabled = !!startDate || !!endDate;
  const isStartDateDisabled = !!period;
  const isEndDateDisabled = !!period || !startDate;

  if (loading) return <Loader />;
  if (error) return <div className="text-danger text-center">Error: {error}</div>;

  return (
    <div className="col-xl-12">
      <div className="card custom-card">
        <div className="d-flex" style={{ padding: " 0" }}>
          <div className="card-header justify-content-between">
            <div
              className="card-title"
              style={{
                marginRight: "150px",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              Expense Breakdown Chart
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
        <div className="card-body" style={{ height: 400, display: "flex", justifyContent: "center" }}>
          {data.length === 0 ? (
            <div className="text-center">No Data Found</div>
          ) : (
            <PieChart width={600} height={400}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={130}
                labelLine={true}
                label={({ name, value }) =>
                  `${name}: ${(value / 1000).toFixed(2)}K`
                }
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `${(value / 1000).toFixed(2)}K`}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            
            </PieChart>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomPieChart;