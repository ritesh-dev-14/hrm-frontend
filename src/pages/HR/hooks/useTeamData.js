import { useReducer, useCallback, useEffect } from "react";
import API from "../../../services/api";
import { notifyError } from "../../../utils/toast";

const initialState = { staff: [], loading: true, error: null };

function teamReducer(state, action) {
  switch (action.type) {
    case "FETCH_START": return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS": return { staff: action.payload, loading: false, error: null };
    case "FETCH_FAILURE": return { ...state, loading: false, error: action.payload };
    default: return state;
  }
}

export function useTeamData() {
  const [state, dispatch] = useReducer(teamReducer, initialState);

  const refresh = useCallback(async () => {
    dispatch({ type: "FETCH_START" });
    try {
      const [empRes, mgrRes] = await Promise.all([
        API.get("/api/hr/employees"),
        API.get("/api/hr/managers"),
      ]);
      
      const managers = (mgrRes.data?.data || []).map(m => ({ ...m, role: "MANAGER" }));
      const employees = (empRes.data?.data || []).map(e => ({ ...e, role: "EMPLOYEE" }));
      
      dispatch({ type: "FETCH_SUCCESS", payload: [...managers, ...employees] });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to sync directory";
      dispatch({ type: "FETCH_FAILURE", payload: msg });
      notifyError(msg);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { ...state, refresh };
}