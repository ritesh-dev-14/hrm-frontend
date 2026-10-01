import Sidebar from "./components/Navbar.jsx";
import { AppRoutes } from "./routes/AppRoutes";
import { useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  const location = useLocation();

  const hideSidebar = location.pathname === "/login";
  const toastContainer = (
    <ToastContainer
      position="bottom-right"
      autoClose={2500}
      theme="light"
      toastClassName="!bg-white !text-slate-900 !rounded-2xl !shadow-xl !border !border-slate-200"
      bodyClassName="text-sm font-medium"
    />
  );

  if (hideSidebar) {
    return (
      <div className="h-screen w-full overflow-y-auto overflow-x-hidden custom-scrollbar">
        <AppRoutes />
        {toastContainer}
      </div>
    );
  }

  return (
    <Sidebar>
      <div className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="max-w-350 p-0 mx-auto ">
          <AppRoutes />
          {toastContainer}
        </div>
      </div>
    </Sidebar>
  );
}
