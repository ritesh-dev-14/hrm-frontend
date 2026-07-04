import { useNavigate } from "react-router-dom";

import AttendanceCard from "../../components/attendece/AttendenceCard";

import DashboardHero from "../../components/dashboard/DashBoardHero";
import QuickActions from "../../components/dashboard/QuickActions";
import StatsCards from "../../components/dashboard/StatsCard";

import API from "../../services/api.js";

import {
  employeeActions,
  employeeStats,
} from "../../components/dashboard/dashboardData.js";

const EmployeeHomePage = () => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const firstName = user.name.split(" ")[0];

  return (
    <div className="min-h-screen bg-[#F6F8FB] p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <DashboardHero
          name={firstName}
          title="Welcome back"
          description="Here's an overview of your attendance, payroll activity, and current work session performance."
          buttonText="Open Attendance"
          onClick={() => navigate("/attendance")}
        />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mb-6">
          <div className="xl:col-span-7">
            <div className="bg-white border border-slate-200 rounded-4xl p-6 h-full shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
              <AttendanceCard />
            </div>
          </div>

          <QuickActions actions={employeeActions} />
        </div>

        <StatsCards stats={employeeStats} />
      </div>
    </div>
  );
};

export default EmployeeHomePage;
