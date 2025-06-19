  const initialState = {
    formData: { username: "", password: "" },
    incomeExpenseData: [],
    total_count: 0,
    loading: false,
    error: null,
    showOtpFields: false,
    otpVerified: false,
    token: null,
    isAuthenticated: false,
    authUser: {
      name: "",
      role: "",
      role_name: ""
    },
    categories: [],
    IncomeCat: [],
    parties: [],
    success: false,
    partySuggestions: [],
    transactions: {
      transactions: [],
      loading: false,
      error: null,
      total: 0,
      currentPage: 1,
      limit: 10,
    },
    categories: {
      data: [],
      total: 0,
      loading: false,
      error: null,
    },
    parties: {
      party: [],
      total_count: 0,
      loading: false,
      error: null,
      currentPage: 1,
      limit: 10,
    },
    Renewal: {
      data: [],
      total_count: 0,
      loading: false,
      error: null,
    },
    Brokerage: {
      data: [],
      total_count: 0,
      loading: false,
      error: null,
    },
    DailyBalance: {
      data: [],
      total_count: 0,
      loading: false,
      error: null,
    },
    Expense: {
      data: [],
      allCount: 0,
      loading: false,
      error: null,
      totalCash: 0,
      todayCash: 0,
    },
    rojmelExpense: {
      data: [],
      allCount: 0,
      loading: false,
      error: null,
    },
    rojmelIncome: {
      data: [],
      count: 0,
      loading: false,
      error: null,
    },
    rojmelReport: {
      data: [],
      count: 0,
      loading: false,
      error: null,
      total_cash: 0,
      today_cash: 0,
    },
    todayRojmelReport: {
      data: [],
      count: 0,
      loading: false,
      error: null,
      total_cash: 0,
      today_cash: 0,
    },
    Reminders: {
      data: [],
      total_count: 0,
      loading: false,
      error: null,
      currentPage: 1,
      limit: 10,
    },
    dashboardCounts: {
      data: {
        total_parties: 0,
        active_parties: 0,
        inactive_parties: 0,
        today_new_parties: 0,
        today_renew_parties: 0,
        today_return_parties: 0,
        today_cash_balance: 0,
        today_transaction: 0,
        total_cash_balance: 0,
      },
      loading: false,
      error: null,
    },
    role: {
      data: [],
      loading: false,
      error: null,
    },
    user: {
      data: [],
      loading: false,
      error: null,
    },
    module: {
      data: [],
      loading: false,
      error: null,
    },
  };

  const authReducer = (state = initialState, action) => {
    switch (action.type) {
      case "UPDATE_FORM":
        return {
          ...state,
          formData: {
            ...state.formData,
            [action.payload.name]: action.payload.value,
          },
        };

      case "LOGIN_REQUEST":
        return { ...state, loading: true, error: null };

      case "LOGIN_SUCCESS":
        return { ...state, loading: false, showOtpFields: true, error: null };

      case "LOGIN_FAILURE":
        return {
          ...state,
          loading: false,
          error: action.payload,
          showOtpFields: false,
        };

      case "VERIFY_OTP_REQUEST":
        return { ...state, loading: true, error: null };

      case "VERIFY_OTP_FAILURE":
        return {
          ...state,
          loading: false,
          error: action.payload,
          otpVerified: false,
        };

    case "OTP_VERIFIED":
      console.log("OTP_VERIFIED payload:", action.payload);

        return {
          ...state,
          loading: false,
          otpVerified: true,
          isAuthenticated: true,
          token: action.payload.token,
          authUser: {
            name: action.payload.name,
            role: action.payload.role,
            role_name: action.payload.role_name,
          },
        };

      case "FETCH_CATEGORIES_REQUEST":
        return {
          ...state,
          categories: {
            ...state.categories,
            loading: true,
            error: null,
          },
        };

      case "FETCH_CATEGORIES_SUCCESS":
        return {
          ...state,
          categories: {
            ...state.categories,
            loading: false,
            data: action.payload.categories,
            total_count: action.payload.total_count, // Make sure this matches
            start: action.payload.start,
            limit: action.payload.limit,
          },
        };

      case "FETCH_CATEGORIES_FAILURE":
        return {
          ...state,
          categories: {
            ...state.categories,
            loading: false,
            error: action.payload,
            data: [],
          },
        };

      case "FETCH_PARTY_REQUEST":
        return {
          ...state,
          parties: {
            ...state.parties,
            loading: true,
            error: null,
          },
        };

      case "FETCH_PARTY_SUCCESS":
        return {
          ...state,
          parties: {
            ...state.parties,
            parties: action.payload.parties,
            total_count: action.payload.total_count,
            currentPage: action.payload.currentPage,
            limit: action.payload.limit,
            loading: false,
            error: null,
          },
        };

      case "FETCH_PARTY_FAILURE":
        return {
          ...state,
          parties: {
            ...state.parties,
            loading: false,
            error: action.payload,
          },
        };

      case "FETCH_PARTY_SUGGESTIONS_SUCCESS":
        return {
          ...state,
          partySuggestions: action.payload,
        };

      case "FETCH_PARTY_SUGGESTIONS_FAILURE":
        return {
          ...state,
          partySuggestions: [],
        };

      case "CLEAR_PARTY_SUGGESTIONS":
        return {
          ...state,
          partySuggestions: [],
        };

      case "FETCH_TRANSACTIONS_REQUEST":
        return {
          ...state,
          transactions: {
            ...state.transactions,
            loading: true,
            error: null,
          },
        };

      case "FETCH_TRANSACTIONS_SUCCESS":
        return {
          ...state,
          transactions: {
            ...state.transactions,
            transactions: action.payload.transactions,
            total_count: action.payload.total_count,
            currentPage: action.payload.currentPage,
            limit: action.payload.limit,
            loading: false,
            error: null,
          },
        };

      case "FETCH_TRANSACTIONS_FAILURE":
        return {
          ...state,
          transactions: {
            ...state.transactions,
            loading: false,
            error: action.payload,
          },
        };

      case "CREATE_TRANSACTION_REQUEST":
        return {
          ...state,
          loading: true,
          error: null,
          success: false,
        };
      case "TRANSACTION_UPDATED":
        return {
          ...state,
          // Update the specific transaction in the array
          transactions: state.transactions.map((transaction) =>
            transaction.tran_id === action.payload.tran_id
              ? action.payload
              : transaction
          ),
        };

      case "INCOME_EXPENSE_LOADING":
        return { ...state, loading: true, error: null };

      case "INCOME_EXPENSE_SUCCESS":
        return {
          ...state,
          loading: false,
          incomeExpenseData: action.payload.data || [],
          total_count: action.payload.total_count || 0,
          error: null,
        };

      case "INCOME_EXPENSE_FAILURE":
        return {
          ...state,
          loading: false,
          error: action.payload,
        };

      case "DUE_RENEWAL_LOADING":
        return {
          ...state,
          Renewal: {
            ...state.Renewal,
            loading: true,
            error: null,
          },
        };

      case "DUE_RENEWAL_SUCCESS":
        return {
          ...state,
          Renewal: {
            ...state.Renewal,
            data: action.payload.data,
            total_count: action.payload.total_count,
            loading: false,
            error: null,
          },
        };

      case "DUE_RENEWAL_FAILURE":
        return {
          ...state,
          Renewal: {
            ...state.Renewal,
            loading: false,
            error: action.payload,
          },
        };

      case "BROKEARGE_REPORT_LOADING":
        return {
          ...state,
          Brokerage: {
            ...state.Brokerage,
            loading: true,
            error: null,
          },
        };

      case "BROKEARGE_REPORT_SUCCESS":
        return {
          ...state,
          Brokerage: {
            ...state.Brokerage,
            data: action.payload.data,
            total_count: action.payload.total_count,
            loading: false,
            error: null,
          },
        };

      case "BROKEARGE_REPORT_FAILURE":
        return {
          ...state,
          Brokerage: {
            ...state.Brokerage,
            loading: false,
            error: action.payload,
          },
        };
      case "DAILY_BALANCE_LOADING":
        return {
          ...state,
          DailyBalance: {
            ...state.DailyBalance,
            loading: true,
            error: null,
          },
        };

      case "DAILY_BALANCE_SUCCESS":
        return {
          ...state,
          DailyBalance: {
            ...state.DailyBalance,
            data: action.payload.data,
            total_count: action.payload.total_count,
            loading: false,
            error: null,
          },
        };

      case "DAILY_BALANCE_FAILURE":
        return {
          ...state,
          DailyBalance: {
            ...state.DailyBalance,
            loading: false,
            error: action.payload,
          },
        };

      case "EXPENSE_REPORT_LOADING":
        return {
          ...state,
          Expense: {
            ...state.Expense,
            loading: true,
            error: null,
          },
        };

      case "EXPENSE_REPORT_SUCCESS":
        return {
          ...state,
          Expense: {
            ...state.Expense,
            data: action.payload.data,
            allCount: action.payload.allCount,
            loading: false,
            error: null,
            totalCash: action.payload.totalCash,
            todayCash: action.payload.todayCash,
          },
        };

      case "EXPENSE_REPORT_FAILURE":
        return {
          ...state,
          Expense: {
            ...state.Expense,
            loading: false,
            error: action.payload,
          },
        };

      case "FETCH_INCOME_CATEGORIES_REQUEST":
        return {
          ...state,
          IncomeCat: {
            ...state.IncomeCat,
            loading: true,
            error: null,
          },
        };

      case "FETCH_INCOME_CATEGORIES_SUCCESS":
        return {
          ...state,
          IncomeCat: {
            ...state.IncomeCat,
            loading: false,
            data: action.payload.IncomeCat,
            total_count: action.payload.total_count, // Make sure this matches
            start: action.payload.start,
            limit: action.payload.limit,
          },
        };

      case "FETCH_INCOME_CATEGORIES_FAILURE":
        return {
          ...state,
          IncomeCat: {
            ...state.IncomeCat,
            loading: false,
            error: action.payload,
            data: [],
          },
        };
      case "ROJMEL_EXPENSE_LOADING":
        return {
          ...state,
          rojmelExpense: {
            ...state.rojmelExpense,
            loading: true,
            error: null,
          },
        };

      case "ROJMEL_EXPENSE_SUCCESS":
        return {
          ...state,
          rojmelExpense: {
            ...state.rojmelExpense,
            data: action.payload.data,
            allCount: action.payload.allCount,
            loading: false,
            error: null,
          },
        };

      case "ROJMEL_EXPENSE_FAILURE":
        return {
          ...state,
          rojmelExpense: {
            ...state.rojmelExpense,
            loading: false,
            error: action.payload,
          },
        };
      case "ROJMEL_INCOME_LOADING":
        return {
          ...state,
          rojmelIncome: {
            ...state.rojmelIncome,
            loading: true,
            error: null,
          },
        };

      case "ROJMEL_INCOME_SUCCESS":
        return {
          ...state,
          rojmelIncome: {
            ...state.rojmelIncome,
            data: action.payload.data,
            count: action.payload.count,
            loading: false,
            error: null,
          },
        };

      case "ROJMEL_INCOME_FAILURE":
        return {
          ...state,
          rojmelIncome: {
            ...state.rojmelIncome,
            loading: false,
            error: action.payload,
          },
        };

      case "ROJMEL_REPORT_LOADING":
        return {
          ...state,
          rojmelReport: {
            ...state.rojmelReport,
            loading: true,
            error: null,
          },
        };

      case "ROJMEL_REPORT_SUCCESS":
        return {
          ...state,
          rojmelReport: {
            ...state.rojmelReport,
            data: action.payload.data,
            count: action.payload.count,
            loading: false,
            error: null,
            total_cash: action.payload.total_cash,
            today_cash: action.payload.today_cash,
          },
        };

      case "ROJMEL_REPORT_FAILURE":
        return {
          ...state,
          rojmelReport: {
            ...state.rojmelReport,
            loading: false,
            error: action.payload,
          },
        };

      case "TODAY_ROJMEL_REPORT_LOADING":
        return {
          ...state,
          todayRojmelReport: {
            ...state.todayRojmelReport,
            loading: true,
            error: null,
          },
        };

      case "TODAY_ROJMEL_REPORT_SUCCESS":
        return {
          ...state,
          todayRojmelReport: {
            ...state.todayRojmelReport,
            data: action.payload.data,
            count: action.payload.count,
            loading: false,
            error: null,
            total_cash: action.payload.total_cash,
            today_cash: action.payload.today_cash,
          },
        };

      case "TODAY_ROJMEL_REPORT_FAILURE":
        return {
          ...state,
          todayRojmelReport: {
            ...state.todayRojmelReport,
            loading: false,
            error: action.payload,
          },
        };

      case "FETCH_REMINDERS_LOADING":
        return {
          ...state,
          Reminders: {
            ...state.Reminders,
            loading: true,
            error: null,
          },
        };

      case "FETCH_REMINDERS_SUCCESS":
        return {
          ...state,
          Reminders: {
            ...state.Reminders,
            data: action.payload.data,
            total_count: action.payload.total_count,
            currentPage: action.payload.currentPage,
            limit: action.payload.limit,
            loading: false,
            error: null,
          },
        };

      case "FETCH_REMINDERS_FAILURE":
        return {
          ...state,
          Reminders: {
            ...state.Reminders,
            loading: false,
            error: action.payload,
          },
        };

      case "DASHBOARD_COUNTS_LOADING":
        return {
          ...state,
          dashboardCounts: {
            ...state.dashboardCounts,
            loading: true,
            error: null,
          },
        };

      case "DASHBOARD_COUNTS_SUCCESS":
        return {
          ...state,
          dashboardCounts: {
            ...state.dashboardCounts,
            data: action.payload,
            loading: false,
            error: null,
          },
        };

      case "DASHBOARD_COUNTS_FAILURE":
        return {
          ...state,
          dashboardCounts: {
            ...state.dashboardCounts,
            loading: false,
            error: action.payload,
          },
        };

      case "TRANSACTION_RENEWED":
        return {
          ...state,
          transactions: {
            ...state.transactions,
            transactions: state.transactions.transactions.map((transaction) =>
              transaction.tran_id === action.payload.tran_id
                ? { ...transaction, ...action.payload }
                : transaction
            ),
          },
        };
      case "FETCH_ROLE_REQUEST":
        return {
          ...state,
          role: {
            ...state.role,
            loading: true,
            error: null,
          },
        };

      case "FETCH_ROLE_SUCCESS":
        return {
          ...state,
          role: {
            ...state.role,
            data: action.payload,
            loading: false,
            error: null,
          },
        };

      case "FETCH_ROLE_FAILURE":
        return {
          ...state,
          role: {
            ...state.role,
            loading: false,
            error: action.payload,
          },
        };
      case "FETCH_USER_REQUEST":
        return {
          ...state,
          user: {
            ...state.user,
            loading: true,
            error: null,
          },
        };

      case "FETCH_USER_SUCCESS":
        return {
          ...state,
          user: {
            ...state.user,
            data: action.payload,
            loading: false,
            error: null,
          },
        };

      case "FETCH_USER_FAILURE":
        return {
          ...state,
          user: {
            ...state.user,
            loading: false,
            error: action.payload,
          },
        };

      case "FETCH_MODULE_REQUEST":
        return {
          ...state,
          module: {
            ...state.module,
            loading: true,
            error: null,
          },
        };

      case "FETCH_MODULE_SUCCESS":
        return {
          ...state,
          module: {
            ...state.module,
            data: action.payload,
            loading: false,
            error: null,
          },
        };

      case "FETCH_MODULE_FAILURE":
        return {
          ...state,
          module: {
            ...state.module,
            loading: false,
            error: action.payload,
          },
        };

      default:
        return state;
    }
  };

  export default authReducer;
