import React, { useState, useEffect } from "react";
import API from "../../services/api";
import { toast } from "react-toastify";
import { Filter, Search, Calendar, User, Briefcase, RefreshCw, Mic, Volume2 } from "lucide-react";

export default function AdminWeeklyVoiceReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [department, setDepartment] = useState("");
  const [weekNumber, setWeekNumber] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    fetchReports();
  }, [department, weekNumber, year]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (department) params.department = department;
      if (weekNumber) params.weekNumber = weekNumber;
      if (year) params.year = year;

      const res = await API.get("/api/weekly-voice-reports", { params });
      setReports(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load voice reports");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setDepartment("");
    setWeekNumber("");
    setYear(new Date().getFullYear().toString());
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="bg-[#0B1120] rounded-3xl p-8 shadow-xl relative overflow-hidden flex items-center justify-between">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full mix-blend-screen filter blur-[80px] opacity-40"></div>
        <div className="absolute -bottom-32 left-10 w-64 h-64 bg-indigo-600 rounded-full mix-blend-screen filter blur-[80px] opacity-30"></div>
        
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold text-white mb-3 flex items-center gap-3">
            <Volume2 className="text-blue-400 w-10 h-10" />
            Company Voice Reports
          </h1>
          <p className="text-blue-100/80 text-lg">
            Listen to the weekly feedback submitted by managers across departments.
          </p>
        </div>
        
        <button 
          onClick={fetchReports}
          className="relative z-10 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white backdrop-blur-md transition-all border border-white/10 shadow-lg flex items-center gap-2"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-gray-700 font-bold mr-2">
          <Filter className="w-5 h-5 text-blue-600" />
          Filters:
        </div>
        
        <select 
          value={department} 
          onChange={(e) => setDepartment(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-gray-700 font-medium text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 min-w-[160px] transition-all"
        >
          <option value="">All Departments</option>
          <option value="Marketing">Marketing (Meta Ads)</option>
          <option value="SEO">SEO</option>
        </select>

        <input 
          type="number" 
          placeholder="Week No (e.g. 42)" 
          value={weekNumber} 
          onChange={(e) => setWeekNumber(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-gray-700 font-medium text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 w-44 transition-all"
        />

        <input 
          type="number" 
          placeholder="Year" 
          value={year} 
          onChange={(e) => setYear(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-gray-700 font-medium text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 w-32 transition-all"
        />

        <button 
          onClick={handleResetFilters}
          className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors ml-auto bg-gray-50 hover:bg-blue-50 px-4 py-2.5 rounded-lg border border-gray-200 hover:border-blue-200"
        >
          Clear Filters
        </button>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-gray-50 rounded-3xl h-[280px] animate-pulse border border-gray-100"></div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border-2 border-gray-100 border-dashed shadow-sm">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No Reports Found</h3>
          <p className="text-gray-500 text-lg">There are no voice reports matching your current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden hover:shadow-blue-900/10 transition-all duration-300 hover:-translate-y-1 group">
              <div className="p-7">
                
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0B1120] to-blue-900 flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {report.manager?.name ? report.manager.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <h3 className="text-gray-800 font-bold text-lg">{report.manager?.name || 'Unknown Manager'}</h3>
                      <p className="text-xs text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded-md inline-block mt-1 border border-blue-100">
                        {report.department}
                      </p>
                    </div>
                  </div>
                  <div className="text-right bg-gray-50 rounded-lg p-2 border border-gray-100">
                    <p className="text-xs font-black text-gray-800">WEEK {report.weekNumber}</p>
                    <p className="text-xs text-gray-500 font-semibold">{report.year}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-2 font-medium"><Calendar className="text-gray-400 w-4 h-4" /> Submitted</span>
                    <span className="font-bold text-gray-800">{new Date(report.reportDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span className="flex items-center gap-2 font-medium"><Briefcase className="text-gray-400 w-4 h-4" /> Clients</span>
                    <span className="font-bold text-green-700 bg-green-100 px-3 py-0.5 rounded-full border border-green-200">
                      {Array.isArray(report.clients) ? report.clients.length : 0} Active
                    </span>
                  </div>
                </div>

                <div className="mt-2 bg-blue-50/50 p-4 rounded-2xl border border-blue-50">
                  <p className="text-xs font-bold text-blue-800 mb-3 flex items-center gap-2 uppercase tracking-wide">
                    <Mic className="w-4 h-4" /> Audio Playback
                  </p>
                  <audio 
                    controls 
                    src={report.audioUrl} 
                    className="w-full h-11"
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
