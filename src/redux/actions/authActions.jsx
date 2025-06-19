  import axios from "axios";

  const base_url = "https://uatapi-pragati.nichetechqa.com/api/v1";

  export const loginUser = (formData) => async (dispatch) => {
    dispatch({ type: "LOGIN_REQUEST" });

    try {
      const response = await fetch(`${base_url}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.errorcode === 0) {
        dispatch({ type: "LOGIN_SUCCESS", payload: data });
        return data;
      } else {
        dispatch({
          type: "LOGIN_FAILURE",
          payload: data.message || "Invalid login attempt.",
        });
        return null;
      }
    } catch (error) {
      console.error("Login API error:", error);
      dispatch({
        type: "LOGIN_FAILURE",
        payload: "Server error. Try again later.",
      });
      return null;
    }
  };

export const verifyOtp = (payload) => async (dispatch) => {
  try {
    const response = await fetch(`${base_url}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const textResponse = await response.text();
    if (!textResponse) {
      throw new Error("Empty response from server");
    }

    const data = JSON.parse(textResponse);
    console.log("Parsed API Response:", data);

    if (data.errorcode === 0) {
      if (data.token) {
        localStorage.setItem("authorization", data.token);
        localStorage.setItem("userData", JSON.stringify({
          name: data.user.name,
          role: data.user.role,
          role_name: data.user.role_name,
          role_id: data.user.id,
          permissions: data.user.description
        }));
      }
      dispatch({
        type: "OTP_VERIFIED",
        payload: {
          token: data.token,
          name: data.user.name,
          role: data.user.role,
          role_name: data.user.role_name, 
          role_id: data.user.id, 
          permissions: data.user.description,
        },
      });
    }

    return data;
  } catch (error) {
    console.error("OTP Verification Error:", error);
    return null;
  }
};

  export const fetchExpenseCategories = (params = {}) => async (dispatch) => {
    const token = localStorage.getItem("authorization");
    const { page = 1, limit = 10 } = params;
    const start = (page - 1) * limit;

    dispatch({ type: "FETCH_CATEGORIES_REQUEST" });

    try {
      let url = `${base_url}/expenses/get-category?start=${start}&limit=${limit}`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      });

      const data = await response.json();

      if (data.errorcode === 0) {
        dispatch({
          type: "FETCH_CATEGORIES_SUCCESS",
          payload: {
            categories: data.data,
            total_count: data.total, // Make sure this matches your API response
            start,
            limit,
          },
        });
      } else {
        dispatch({
          type: "FETCH_CATEGORIES_FAILURE",
          payload: data.message || "Failed to fetch categories",
        });
      }
    } catch (error) {
      dispatch({ 
        type: "FETCH_CATEGORIES_FAILURE", 
        payload: "Server error" 
      });
    }
  };


  export const createExpenseCategory = (data) => async (dispatch) => {
    try {
      const token = localStorage.getItem("authorization");
      const response = await fetch(
        `${base_url}/expenses/create-category`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      return result;
    } catch (error) {
      throw error;
    }
  };

  export const deleteExpenseCategory = (id) => async () => {
    try {
      const token = localStorage.getItem("authorization");
      const response = await fetch(
        `${base_url}/expenses/delete-category/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `${token}`,
          },
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  };

  export const updateExpenseCategory = (data) => async (dispatch, getState) => {
    try {
      const token = localStorage.getItem("authorization");
      const response = await fetch(
        `${base_url}/expenses/edit-category`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Edit category error:", error);
      return { error: true, message: "Edit failed" };
    }
  };

  export const toggleCategoryStatus = (id, status) => async (dispatch, getState) => {
    try {
      const token = localStorage.getItem("authorization");
      const state = getState();
      
      // Safely access categories
      const categories = state.auth.categories?.data || [];
      
      if (!Array.isArray(categories)) {
        return { errorcode: 1, message: "Invalid category data" };
      }

      const category = categories.find(cat => cat.id === id);
      
      if (!category) {
        return { errorcode: 1, message: "Category not found" };
      }

      // Include all required fields to prevent data loss
      const payload = {
        id: id,
        name: category.name, // Preserve existing name
        status: status,
        // Include other required fields here
        ...(category.created_at && { 
          date: category.created_at.split("T")[0] 
        })
      };

      const response = await fetch(`${base_url}/expenses/edit-category`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify(payload),
      });

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error(text.substring(0, 100));
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Update failed");
      }

      return data;
      
    } catch (error) {
      console.error("Toggle error:", error);
      return { 
        errorcode: 1, 
        message: error.message.includes('<!DOCTYPE') 
          ? "Server error occurred" 
          : error.message || "Update failed"
      };
    }
  };


  // export const fetchParty = () => async (dispatch, getState) => {
  //   const token = localStorage.getItem("authorization");

  //   if (!token) {
  //     console.error("No token found in localStorage");
  //     return;
  //   }

  //   dispatch({ type: "FETCH_PARTY_REQUEST" });

  //   try {
  //     const response = await fetch("https://api-pragati.nichetechqa.com/api/v1/parties/list", {
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `${token}`,
  //       },
  //     });

  //     const data = await response.json();

  //     if (data.errorcode === 0) {
  //       dispatch({ type: "FETCH_PARTY_SUCCESS", payload: data.data });
  //     } else {
  //       dispatch({ type: "FETCH_PARTY_FAILURE", payload: data.message || "Failed to fetch categories" });
  //     }
  //   } catch (error) {
  //     console.error( "Fetch Categories Error:", error);
  //     dispatch({ type: "FETCH_PARTY_FAILURE", payload: "Server error" });
  //   }
  // };

  export const fetchParty =
    (
      status = "",
      period = "",
      start_date = "",
      end_date = "",
      start = 0,
      limit = 10
    ) =>
    async (dispatch) => {
      dispatch({ type: "FETCH_PARTY_REQUEST" });

      try {
        const token = localStorage.getItem("authorization");
        const queryParams = new URLSearchParams({
          status,
          period,
          start_date,
          end_date,
          start: start.toString(),
          limit: limit.toString(),
        });

        const url = `${base_url}/parties/list?${queryParams.toString()}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: ` ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          dispatch({
            type: "FETCH_PARTY_SUCCESS",
            payload: {
              parties: data.data || [],
              total_count: data.total_count || 0,
              currentPage: Math.floor(start / limit) + 1,
              limit,
            },
          });
        } else {
          dispatch({
            type: "FETCH_PARTY_FAILURE",
            payload: data.message || "Failed to fetch parties",
          });
        }
      } catch (error) {
        dispatch({
          type: "FETCH_PARTY_FAILURE",
          payload: error.message || "Something went wrong",
        });
      }
    };

  export const createParty = (data) => async (dispatch) => {
    try {
      const token = localStorage.getItem("authorization");
      const response = await fetch(
        `${base_url}/parties/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      return result;
    } catch (error) {
      throw error;
    }
  };

  export const deleteParty = (id) => async () => {
    try {
      const token = localStorage.getItem("authorization");
      const response = await fetch(
        `${base_url}/parties/delete/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `${token}`,
          },
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  };

  export const updateParty = (data) => async (dispatch, getState) => {
    try {
      const token = localStorage.getItem("authorization");
      const response = await fetch(
        `${base_url}/parties/edit/${data.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Edit category error:", error);
      return { error: true, message: "Edit failed" };
    }
  };

  // Fetch party name suggestions for autocomplete
  export const fetchPartySuggestions = (searchTerm) => async (dispatch) => {
    try {
      const token = localStorage.getItem("authorization");

      const response = await fetch(
        `${base_url}/parties/list?search=${searchTerm}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.errorcode === 0) {
        dispatch({
          type: "FETCH_PARTY_SUGGESTIONS_SUCCESS",
          payload: data.data,
        });
      } else {
        dispatch({ type: "FETCH_PARTY_SUGGESTIONS_FAILURE", payload: [] });
      }
    } catch (error) {
      console.error("Error fetching party suggestions:", error);
      dispatch({ type: "FETCH_PARTY_SUGGESTIONS_FAILURE", payload: [] });
    }
  };
  export const clearPartySuggestions = () => ({
    type: "CLEAR_PARTY_SUGGESTIONS",
  });

  export const fetchTransactions = () => async (dispatch) => {
    const token = localStorage.getItem("authorization");

    try {
      const response = await axios.get(
        `${base_url}/transactions/list`,
        {
          headers: {
            Authorization: ` ${token}`,
          },
        }
      );
      dispatch({
        type: "FETCH_TRANSACTIONS_SUCCESS",
        payload: response.data,
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      dispatch({
        type: "FETCH_TRANSACTIONS_FAILURE",
        payload: error.response?.data?.message || "Failed to fetch transactions",
      });
    }
  };

  export const createTransaction = (transactionData) => async (dispatch) => {
    try {
      const token = localStorage.getItem("authorization");
      const response = await fetch(
        `${base_url}/transactions/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: ` ${token}`,
          },
          body: JSON.stringify(transactionData),
        }
      );

      const result = await response.json();

      return result;
    } catch (error) {
      throw error;
    }
  };


  export const fetchPaginatedTransactions = (
    start = 0,
    limit = 25,
    period = "",
    start_date = "",
    end_date = "",
    status = ""
  ) => {
    return async (dispatch) => {
      dispatch({ type: "FETCH_TRANSACTIONS_REQUEST" });

      try {
        const queryParams = new URLSearchParams({
          start: start.toString(),
          limit: limit.toString(),
        });

        if (period) queryParams.append("period", period);
        if (start_date) queryParams.append("start_date", start_date);
        if (end_date) queryParams.append("end_date", end_date);
        if (status) queryParams.append("status", status);

        const url = `${base_url}/transactions/list?${queryParams.toString()}`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: localStorage.getItem("authorization"),
          },
        });

        const data = await response.json();

        if (response.ok) {
          dispatch({
            type: "FETCH_TRANSACTIONS_SUCCESS",
            payload: {
              transactions: data.data.transactions || [],
              total_count: data.total_count || 0,
              currentPage: Math.floor(start / limit) + 1,
              limit,
            },
          });
          return data;
        } else {
          dispatch({
            type: "FETCH_TRANSACTIONS_FAILURE",
            payload: data.message || "Failed to fetch transactions",
          });
          return data;
        }
      } catch (error) {
        dispatch({
          type: "FETCH_TRANSACTIONS_FAILURE",
          payload: error.message || "Something went wrong",
        });
        return { error: error.message };
      }
    };
  };

  export const deleteTransaction = (id) => async (dispatch) => {
    try {
      const token = localStorage.getItem("authorization");

      const response = await fetch(
        `${base_url}/transactions/delete/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          `Failed to delete the transaction. Status: ${response.status}`
        );
      }

      return result;
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  };

  // Add this function to your authActions.jsx file
  export const editTransaction = (data) => async (dispatch) => {
    try {
      const token = localStorage.getItem("authorization");
      const response = await fetch(
        `${base_url}/transactions/edit/${data.tran_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update transaction");
      }

      const result = await response.json();

      if (result.errorcode !== 0) {
        throw new Error(result.message || "Transaction update failed");
      }

      // Return the entire result object
      return result;
    } catch (error) {
      console.error("Edit transaction error:", error);
      throw error;
    }
  };

 
  export const fetchIncomeExpenseReport = (params = {}) => async (dispatch) => {
    const token = localStorage.getItem('authorization');


    try {
      dispatch({ type: 'INCOME_EXPENSE_LOADING' });
      
      const response = await axios.get(
        `${base_url}/reports/income-vs-expense-report`,
        {
          headers: {
            'Authorization': `${token}`,
          },
          params: {
            period: params.period || '',
            start_date: params.start_date || '',
            end_date: params.end_date || '',
            start: params.start || 0,
            limit: params.limit || 25,
          }
        }
      );

      dispatch({
        type: 'INCOME_EXPENSE_SUCCESS',
        payload: {
          data: response.data.transactions || [],
          total_count: response.data.total_count || 0
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching income/expense report:', error);
      dispatch({
        type: 'INCOME_EXPENSE_FAILURE',
        payload: error.response?.data?.message || 'Failed to fetch report',
      });
      throw error;
    }
  };

  export const fetchDueRenewal = (params = {}) => async (dispatch) => {
    const token = localStorage.getItem('authorization');
    
    try {
      dispatch({ type: 'DUE_RENEWAL_LOADING' });
      
      const response = await axios.get(`${base_url}/reports/due-report`, {
        headers: { 'Authorization': `${token}` },
        params: {
          period: params.period || '',
          start_date: params.start_date || '',
          end_date: params.end_date || '',
          start: params.start || 0,
          limit: params.limit || 25,
        }
      });
      
      dispatch({
        type: 'DUE_RENEWAL_SUCCESS',
        payload: {
          data: response.data.data.transactions || [],
          total_count: response.data.total_count || 0
        }
      });
      
    } catch (error) {
      console.error('API Error:', error);
      dispatch({
        type: 'DUE_RENEWAL_FAILURE',
        payload: error.response?.data?.message || 'Failed to fetch report',
      });
    }
  };

  export const fetchBrokerageReport = (params = {}) => async (dispatch) => {
    const token = localStorage.getItem('authorization');
    
    try {
      dispatch({ type: 'BROKEARGE_REPORT_LOADING' });
      
      const response = await axios.get(`${base_url}/reports/interest-and-brokerage-report`, {
        headers: { 'Authorization': `${token}` },
        params: {
          period: params.period || '',
          start_date: params.start_date || '',
          end_date: params.end_date || '',
          start: params.start || 0,
          limit: params.limit || 25,
        }
      });

      dispatch({
        type: 'BROKEARGE_REPORT_SUCCESS',
        payload: {
          data: response.data.data.transactions || [],
          total_count: response.data.total_count || 0
        }
      });
      
    } catch (error) {
      console.error('API Error:', error);
      dispatch({
        type: 'BROKEARGE_REPORT_FAILURE',
        payload: error.response?.data?.message || 'Failed to fetch report',
      });
    }
  };

  export const FetchDailyBalance = (params = {}) => async (dispatch) => {
    const token = localStorage.getItem('authorization');
    
    try {
      dispatch({ type: 'DAILY_BALANCE_LOADING' });
      
      const response = await axios.get(`${base_url}/reports/daily-closing-report`, {
        headers: { 'Authorization': `${token}` },
        params: {
          period: params.period || '',
          start_date: params.start_date || '',
          end_date: params.end_date || '',
          start: params.start || 0,
          limit: params.limit || 25,
        }
      });

      dispatch({
        type: 'DAILY_BALANCE_SUCCESS',
        payload: {
          data: response.data.data || [],
          total_count: response.data.total_count || 0
        }
      });
      
    } catch (error) {
      console.error('API Error:', error);
      dispatch({
        type: 'DAILY_BALANCE_FAILURE',
        payload: error.response?.data?.message || 'Failed to fetch report',
      });
    }
  };

  export const FetchExpenseReport = (params = {}) => async (dispatch) => {
    const token = localStorage.getItem('authorization');
    
    try {
      dispatch({ type: 'EXPENSE_REPORT_LOADING' });
      
      const response = await axios.get(`${base_url}/reports/expense-report`, {
        headers: { 'Authorization': `${token}` },
        params: {
          period: params.period || '',
          start_date: params.start_date || '',
          end_date: params.end_date || '',
          start: params.start || 0,
          limit: params.limit || 25,
        }
      });

      dispatch({
        type: 'EXPENSE_REPORT_SUCCESS',
        payload: {
          data: response.data.allExpenses || [],
          allCount: response.data.allCount || 0,
          totalCash: response.data.totalCash || 0,       // Add this
          todayCash: response.data.todayCash || 0  // Add this
        }
      });
      
    } catch (error) {
      console.error('API Error:', error);
      dispatch({
        type: 'EXPENSE_REPORT_FAILURE',
        payload: error.response?.data?.message || 'Failed to fetch report',
      });
    }
  };

  export const fetchIncomeCategories = (params = {}) => async (dispatch) => {
    const token = localStorage.getItem("authorization");
    const { page = 1, limit = 10 } = params;
    const start = (page - 1) * limit;

    dispatch({ type: "FETCH_INCOME_CATEGORIES_REQUEST" });

    try {
      let url = `${base_url}/expenses/get-income-category?start=${start}&limit=${limit}`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      });

      const data = await response.json();

      if (data.errorcode === 0) {
        dispatch({
          type: "FETCH_INCOME_CATEGORIES_SUCCESS",
          payload: {
            IncomeCat: data.data,
            total_count: data.total, // Make sure this matches your API response
            start,
            limit,
          },
        });
      } else {
        dispatch({
          type: "FETCH_INCOME_CATEGORIES_FAILURE",
          payload: data.message || "Failed to fetch categories",
        });
      }
    } catch (error) {
      dispatch({ 
        type: "FETCH_INCOME_CATEGORIES_FAILURE", 
        payload: "Server error" 
      });
    }
  };

  export const createIncomeCategory = (data) => async (dispatch) => {
    try {
      const token = localStorage.getItem("authorization");
      const response = await fetch(
        `${base_url}/expenses/create-income-category`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      return result;
    } catch (error) {
      throw error;
    }
  };

  export const deleteIncomeCategory = (id) => async () => {
    try {
      const token = localStorage.getItem("authorization");
      const response = await fetch(
        `${base_url}/expenses/delete-income-category/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `${token}`,
          },
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  };

    export const updateIncomeCategory = (data) => async (dispatch, getState) => {
      try {
        const token = localStorage.getItem("authorization");
        const response = await fetch(
          `${base_url}/expenses/edit-income-category/${data.id}`,  // Added slash before id and used data.id
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `${token}`,
            },
            body: JSON.stringify(data),
          }
        );
    
        const result = await response.json();
        return result;
      } catch (error) {
        console.error("Edit category error:", error);
        return { error: true, message: "Edit failed" };
      }
    };


    export const toggleIncomeStatus = (id, status) => async (dispatch, getState) => {
      try {
        const token = localStorage.getItem("authorization");
        const state = getState();
        
        // Safely access categories
        const IncomeCat = state.auth.IncomeCat?.data || [];
        
        if (!Array.isArray(IncomeCat)) {
          return { errorcode: 1, message: "Invalid category data" };
        }
    
        const category = IncomeCat.find(cat => cat.id === id);
        
        if (!category) {
          return { errorcode: 1, message: "Category not found" };
        }
    
        // Include all required fields to prevent data loss
        const payload = {
          id: id,  
          name: category.name,
          status: status,
    
          ...(category.created_at && { 
            date: category.created_at.split("T")[0] 
          })
        };
    
        // Include ID in the URL
        const response = await fetch(`${base_url}/expenses/edit-income-category/${id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify(payload),
        });
    
        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          const text = await response.text();
          throw new Error(text.substring(0, 100));
        }
    
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Update failed");
        }
    
        return data;
        
      } catch (error) {
        console.error("Toggle error:", error);
        return { 
          errorcode: 1, 
          message: error.message.includes('<!DOCTYPE') 
            ? "Server error occurred" 
            : error.message || "Update failed"
        };
      }
  };

  export const fetchRojmelExpense = (params = {}) => async (dispatch) => {
    const token = localStorage.getItem('authorization');
    
    try {
      dispatch({ type: 'ROJMEL_EXPENSE_LOADING' });
      
      const response = await axios.get(`${base_url}/expenses/expense-list`, {
        headers: { 'Authorization': `${token}` },
        params: {
          start_date: params.start_date || '',
          end_date: params.end_date || '',
          start: params.start || 0,
          limit: params.limit || 25,
        }
      });
      
      dispatch({
        type: 'ROJMEL_EXPENSE_SUCCESS',
        payload: {
          data: response.data.allExpenses || [],
          allCount: response.data.allCount || 0
        }
      });
      
    } catch (error) {
      console.error('API Error:', error);
      dispatch({
        type: 'ROJMEL_EXPENSE_FAILURE',
        payload: error.response?.data?.message || 'Failed to fetch report',
      });
    }
  };

  export const fetchRojmelIncome = (params = {}) => async (dispatch) => {
    const token = localStorage.getItem('authorization');
    
    try {
      dispatch({ type: 'ROJMEL_INCOME_LOADING' });
      
      const response = await axios.get(`${base_url}/income/list-income-transaction`, {
        headers: { 'Authorization': `${token}` },
        params: {
          start_date: params.start_date || '',
          end_date: params.end_date || '',
          start: params.start || 0,
          limit: params.limit || 25,
        }
      });
      
      dispatch({
        type: 'ROJMEL_INCOME_SUCCESS',
        payload: {
          data: response.data.data || [],
          count: response.data.count || 0
        }
      });
      
    } catch (error) {
      console.error('API Error:', error);
      dispatch({
        type: 'ROJMEL_INCOME_FAILURE',
        payload: error.response?.data?.message || 'Failed to fetch report',
      });
    }
  };


  // Add this to your authActions.js
  export const fetchIncomeCategoriesBySearch = (searchTerm = "") => async (dispatch) => {
    const token = localStorage.getItem("authorization");
    
    try {
      const response = await fetch(
        `${base_url}/expenses/get-income-category-by-search?search=${searchTerm}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.errorcode === 0) {
        return data.data; // Return the categories array
      } else {
        throw new Error(data.message || "Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error fetching income categories:", error);
      throw error;
    }
  };



  export const createIncomeTransaction = (transactionData) => async (dispatch) => {
    try {
      const token = localStorage.getItem("authorization");
      const response = await fetch(
        `${base_url}/income/create-income-transaction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify(transactionData),
        }
      );

      const result = await response.json();

      if (result.errorcode === 0) {
        // Refresh the income list after successful creation
        const params = {
          start_date: "",
          end_date: "",
          start: 0,
          limit: 10,
        };
        dispatch(fetchRojmelIncome(params));
        
        return result;
      } else {
        throw new Error(result.message || "Failed to create income transaction");
      }
    } catch (error) {
      console.error("Create income transaction error:", error);
      throw error;
    }
  };

  export const deleteIncomeTransaction = (id) => async () => {
    try {
      const token = localStorage.getItem("authorization");
      const response = await fetch(
        `${base_url}/income/delete-income-transaction/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `${token}`,
          },
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  };

  export const editIncomeTransaction = (data) => async (dispatch) => {
    try {
      // Validate input data
      if (!data.tran_id || !data.amount || !data.start_date || !data.income_category_id) {
        throw new Error("Missing required fields: tran_id, amount, start_date, or income_category_id");
      }
  
      const token = localStorage.getItem("authorization");
      if (!token) {
        throw new Error("No authorization token found");
      }
  
      const payload = {
        amount: parseInt(data.amount), // Ensure amount is an integer
        start_date: data.start_date,
        income_category_id: data.income_category_id,
        comments: data.comments || "", // Default to empty string if comments are undefined
      };
  
      const response = await fetch(
        `${base_url}/income/edit-income-transaction/${data.tran_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`, // Standardize to Bearer token format
          },
          body: JSON.stringify(payload),
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to update transaction (Status: ${response.status})`
        );
      }
  
      const result = await response.json();
  
      if (result.errorcode !== 0) {
        throw new Error(result.message || "Transaction update failed");
      }
  
      return result;
    } catch (error) {
      console.error("Edit transaction error:", {
        message: error.message,
        tran_id: data.tran_id,
      });
      throw error;
    }
  };

  export const fetchExpenseCategoriesBySearch = (searchTerm = "") => async (dispatch) => {
    const token = localStorage.getItem("authorization");
    
    try {
      const response = await fetch(
        `${base_url}/expenses/get-category-by-search?search=${searchTerm}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.errorcode === 0) {
        return data.data; // Return the categories array
      } else {
        throw new Error(data.message || "Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error fetching income categories:", error);
      throw error;
    }
  };


  export const createExpenseTransaction = (transactionData) => async (dispatch) => {
    try {
      const token = localStorage.getItem("authorization");
      
      // Note: Don't set Content-Type header when sending FormData
      // The browser will set it automatically with the correct boundary
      const response = await fetch(`${base_url}/expenses/create`, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
        },
        body: transactionData, // No JSON.stringify needed for FormData
      });
  
      const result = await response.json();
  
      if (result.errorcode === 0) {
        // Refresh the expense list after successful creation
        const params = {
          start_date: "",
          end_date: "",
          start: 0,
          limit: 10,
        };
        dispatch(fetchRojmelExpense(params));
        
        return result;
      } else {
        throw new Error(result.message || "Failed to create expense transaction");
      }
    } catch (error) {
      console.error("Create expense transaction error:", error);
      throw error;
    }
  };


  export const deleteExpenseTransaction = (id) => async () => {
    try {
      const token = localStorage.getItem("authorization");
      const response = await fetch(
        `${base_url}/expenses/delete/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `${token}`,
          },
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  };

  export const editExpenseTransaction = (transactionData) => async (dispatch) => {
    try {
      const token = localStorage.getItem("authorization");
      if (!token) {
        throw new Error("No authorization token found");
      }
  
      // Note: Don't set Content-Type header when sending FormData
      // The browser will set it automatically with the correct boundary
      const response = await fetch(
        `${base_url}/expenses/edit/${transactionData.get("tran_id")}`,
        {
          method: "POST",
          headers: {
            Authorization: `${token}`,
          },
          body: transactionData,
        }
      );
  
      const result = await response.json();
  
      if (result.errorcode === 0) {
        // Refresh the expense list after successful update
        const params = {
          start_date: "",
          end_date: "",
          start: 0,
          limit: 10,
        };
        dispatch(fetchRojmelExpense(params));
        return result;
      } else {
        throw new Error(result.message || "Failed to update expense transaction");
      }
    } catch (error) {
      console.error("Edit expense transaction error:", error);
      throw error;
    }
  };
 

// authActions.js
export const fetchTodayReportRojmel = (params = {}) => async (dispatch) => {
  const token = localStorage.getItem('authorization');

  try {
    dispatch({ type: 'TODAY_ROJMEL_REPORT_LOADING' });

    const today = new Date().toISOString().split('T')[0]; 
    const response = await axios.get(`${base_url}/expenses/get-expense`, {
      headers: { 'Authorization': `${token}` },
      params: {
        start_date: params.start_date || today,
        end_date: params.end_date || today,
        start: params.start || 0,
        limit: params.limit || 25,
      },
    });

    dispatch({
      type: 'TODAY_ROJMEL_REPORT_SUCCESS',
      payload: {
        data: response.data.data.todayExpenses || [], // Nested under data
        count: response.data.data.todayCount || 0,    // Nested under data
        total_cash: response.data.data.cashSummary.total_cash || 0, // Nested under data
        today_cash: response.data.data.cashSummary.today_cash || 0  // Nested under data
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    dispatch({
      type: 'TODAY_ROJMEL_REPORT_FAILURE',
      payload: error.response?.data?.message || 'Failed to fetch today report',
    });
  }
};

// Existing action for All Transactions (unchanged)
export const fetchAllReportRojmel = (params = {}) => async (dispatch) => {
  const token = localStorage.getItem('authorization');

  try {
    dispatch({ type: 'ROJMEL_REPORT_LOADING' });

    const response = await axios.get(`${base_url}/expenses/get-expense`, {
      headers: { 'Authorization': `${token}` },
      params: {
        start_date: params.start_date || '',
        end_date: params.end_date || '',
        start: params.start || 0,
        limit: params.limit || 25,
      },
    });

    dispatch({
      type: 'ROJMEL_REPORT_SUCCESS',
      payload: {
        data: response.data.data.allExpenses || [], // Nested under data
        count: response.data.data.allCount || 0,    // Nested under data
        total_cash: response.data.data.cashSummary.total_cash || 0, // Nested under data
        today_cash: response.data.data.cashSummary.today_cash || 0  // Nested under data
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    dispatch({
      type: 'ROJMEL_REPORT_FAILURE',
      payload: error.response?.data?.message || 'Failed to fetch report',
    });
  }
};

  export const fetchReminders = (params = {}) => async (dispatch) => {
    const token = localStorage.getItem('authorization');

    try {
      dispatch({ type: 'FETCH_REMINDERS_LOADING' });

      const response = await axios.get(`${base_url}/transactions/reminder`, {
        headers: { 'Authorization': `${token}` },
        params: {
          start_date: params.start_date,
          end_date: params.end_date,
          start: params.start || 0,
          limit: params.limit || 10,
        }
      });

      dispatch({
        type: 'FETCH_REMINDERS_SUCCESS',
        payload: {
          data: response.data.data.reminder || [],
          total_count: response.data.total_count || 0,
          currentPage: Math.floor((params.start || 0) / (params.limit || 10)) + 1,
          limit: params.limit || 10,
        },
      });
    } catch (error) {
      console.error('API Error:', error);
      dispatch({
        type: 'FETCH_REMINDERS_FAILURE',
        payload: error.response?.data?.message || 'Failed to fetch reminders',
      });
    }
  };

// authActions.js

export const fetchDashboardCounts = (params = {}) => async (dispatch) => {
  const token = localStorage.getItem('authorization');

  try {
    dispatch({ type: 'DASHBOARD_COUNTS_LOADING' });

    const response = await axios.get(`${base_url}/dashboard/dashboard-count`, {
      headers: { 'Authorization': `${token}` },
    });

    dispatch({
      type: 'DASHBOARD_COUNTS_SUCCESS',
      payload: response.data.data || {},
    });

    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    dispatch({
      type: 'DASHBOARD_COUNTS_FAILURE',
      payload: error.response?.data?.message || 'Failed to fetch dashboard counts',
    });
  }
};

// Add this to your authActions.js
export const returnTransaction = (tranId) => async (dispatch) => {
  try {
    const token = localStorage.getItem("authorization");
    const returnTransactionresponse = await fetch(
      `${base_url}/transactions/return/${tranId}`,
      {
        method: "GET",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (data.errorcode === 0) {
      dispatch({ type: "TRANSACTION_RETURNED", payload: tranId });
      return data;
    } else {
      throw new Error(data.message || "Failed to return transaction");
    }
  } catch (error) {
    console.error("Return transaction error:", error);
    throw error;
  }
};

export const renewTransaction = (payload) => async (dispatch) => {
  try {
    const token = localStorage.getItem("authorization");
    if (!token) {
      throw new Error("No authorization token found");
    }

    const response = await fetch(
      `${base_url}/transactions/renew/${payload.tran_id}`,
      {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to renew transaction");
    }

    if (data.errorcode === 0) {
      dispatch({ 
        type: "TRANSACTION_RENEWED", 
        payload: {
          ...data.data, // Make sure this contains the transaction data
          tran_id: payload.tran_id // Ensure we have the transaction ID
        }
      });
      return data;
    } else {
      throw new Error(data.message || "Failed to renew transaction");
    }
  } catch (error) {
    console.error("Renew transaction error:", error);
    throw error;
  }
};


  export const fetchRole = () => async (dispatch, getState) => {
    const token = localStorage.getItem("authorization");

    dispatch({ type: "FETCH_ROLE_REQUEST" });

    try {
      const response = await fetch(`${base_url}/auth/get-role`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      });

      const data = await response.json();

      if (data.errorcode === 0) {
        dispatch({ type: "FETCH_ROLE_SUCCESS", payload: data.data });
      } else {
        dispatch({ type: "FETCH_ROLE_FAILURE", payload: data.message || "Failed to fetch categories" });
      }
    } catch (error) {
      dispatch({ type: "FETCH_ROLE_FAILURE", payload: "Server error" });
    }
  };

    export const fetchUser = () => async (dispatch, getState) => {
    const token = localStorage.getItem("authorization");

    dispatch({ type: "FETCH_USER_REQUEST" });

    try {
      const response = await fetch(`${base_url}/auth/list-user`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      });

      const data = await response.json();

      if (data.errorcode === 0) {
        dispatch({ type: "FETCH_USER_SUCCESS", payload: data.data });
      } else {
        dispatch({ type: "FETCH_USER_FAILURE", payload: data.message || "Failed to fetch categories" });
      }
    } catch (error) {
      dispatch({ type: "FETCH_USER_FAILURE", payload: "Server error" });
    }
  };

  
  export const fetchModule = () => async (dispatch, getState) => {
    const token = localStorage.getItem("authorization");

    if (!token) {
      console.error("No token found in localStorage");
      return;
    }

    dispatch({ type: "FETCH_MODULE_REQUEST" });

    try {
      const response = await fetch(`${base_url}/auth/module`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      });

      const data = await response.json();

      if (data.errorcode === 0) {
        dispatch({ type: "FETCH_MODULE_SUCCESS", payload: data.data });
      } else {
        dispatch({ type: "FETCH_MODULE_FAILURE", payload: data.message || "Failed to fetch categories" });
      }
    } catch (error) {
      console.error( "Fetch Categories Error:", error);
      dispatch({ type: "FETCH_MODULE_FAILURE", payload: "Server error" });
    }
  };

export const createRole = (data) => async (dispatch) => {
  try {
    const token = localStorage.getItem("authorization");
    const response = await fetch(
      `${base_url}/auth/create-role`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify(data), 
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
};


 export const deleteRole = (id) => async () => {
    try {
      const token = localStorage.getItem("authorization");
      const response = await fetch(
        `${base_url}/auth/delete-role/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `${token}`,
          },
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  };

     export const createUser = (data) => async (dispatch) => {
    try {
      const token = localStorage.getItem("authorization");
      const response = await fetch(
        `${base_url}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      return result;
    } catch (error) {
      throw error;
    }
  };

   export const deleteUser = (id) => async () => {
    try {
      const token = localStorage.getItem("authorization");
      const response = await fetch(
        `${base_url}/auth/delete-user/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `${token}`,
          },
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  };

export const updateRole = (data) => async (dispatch, getState) => {
  try {
    const token = localStorage.getItem("authorization");
    const response = await fetch(
      `${base_url}/auth/edit-role/${data.id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Edit category error:", error);
    return { error: true, message: "Edit failed" };
  }
}
  
 export const updateUser = (data) => async (dispatch, getState) => {
    try {
      const token = localStorage.getItem("authorization");
      const response = await fetch(
        `${base_url}/auth/update-user/${data.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Edit category error:", error);
      return { error: true, message: "Edit failed" };
    }
  };

