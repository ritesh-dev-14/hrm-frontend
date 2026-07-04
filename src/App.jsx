import Sidebar from "./components/Navbar.jsx";
import { AppRoutes } from "./routes/AppRoutes";
import { useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  const location = useLocation();

  const hideSidebar = location.pathname === "/login";

  return (
    <div className="flex h-screen w-full bg-[#FDFDFD] overflow-hidden">
      {!hideSidebar && <Sidebar />}

      <div className="flex-1 overflow-y-auto pt-18 lg:pt-0 overflow-x-hidden custom-scrollbar">
        <div className="max-w-350 p-0 mx-auto ">
          <AppRoutes />
          {/* <ToastContainer
            position="top-right"
            autoClose={2500}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            theme="light"
          /> */}
          <ToastContainer
            position="bottom-right"
            autoClose={2500}
            theme="light"
            toastClassName="!bg-white !text-slate-900 !rounded-2xl !shadow-xl !border !border-slate-200"
            bodyClassName="text-sm font-medium"
          />
        </div>
      </div>
    </div>
  );
}
