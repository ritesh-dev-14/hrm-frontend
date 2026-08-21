import React, { useState, useEffect } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Calendar,
  Search,
  Activity,
  Users,
  Video,
  BarChart2,
} from "lucide-react";
import ProfessionalLoader from "../components/ProfessionalLoader";

const DailyDepartmentReportPage = () => {
  const { role } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [department, setDepartment] = useState("all");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReport = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await API.get("/api/daily-report", {
        params: { date, department },
      });
      setReportData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [date, department]);

  if (loading && !reportData) {
    return <ProfessionalLoader text="Loading. Please wait..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Daily Department Report
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Unified report across Social Media, SEO, and Marketing
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
            <Calendar className="w-5 h-5 text-gray-500 mr-2" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent border-none outline-none text-gray-700 font-medium cursor-pointer"
            />
          </div>

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="bg-gray-100 border-none outline-none text-gray-700 font-medium rounded-lg px-4 py-2 cursor-pointer"
          >
            <option value="all">All Departments</option>
            <option value="social_media">Social Media</option>
            <option value="marketing">Marketing</option>
            <option value="seo">SEO</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {reportData && (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCard
              title="Total Projects"
              value={reportData.summary.totalProjects}
              color="blue"
            />
            <SummaryCard
              title="Social Media Submitted"
              value={`${reportData.summary.socialMedia.submitted}/${reportData.summary.socialMedia.total}`}
              color="indigo"
            />
            <SummaryCard
              title="Marketing Submitted"
              value={`${reportData.summary.marketing.submitted}/${reportData.summary.marketing.total}`}
              color="purple"
            />
            <SummaryCard
              title="SEO Submitted"
              value={`${reportData.summary.seo.submitted}/${reportData.summary.seo.total}`}
              color="emerald"
            />
          </div>

          {/* Social Media Section */}
          {(department === "all" || department === "social_media") &&
            reportData.socialMedia.length > 0 && (
              <Section
                title="Social Media — Content & Uploads"
                icon={<Video className="w-5 h-5 text-indigo-600" />}
              >
                <div className="grid gap-6">
                  {reportData.socialMedia.map((project) => (
                    <div
                      key={project.projectId}
                      className="border border-gray-100 bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-50">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">
                            {project.projectName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Manager:{" "}
                            {project.managers.join(", ") || "Unassigned"}
                          </p>
                          {project.clientName && (
                            <p className="text-sm text-gray-500">
                              Client:{" "}
                              <span className="font-medium text-gray-700">
                                {project.clientName}
                              </span>
                            </p>
                          )}
                          {project.clientContactNumber && (
                            <p className="text-sm text-gray-500">
                              Contact No.:{" "}
                              <span className="font-medium font-mono text-gray-700">
                                {project.clientContactNumber}
                              </span>
                            </p>
                          )}
                        </div>
                        <StatusBadge
                          status={
                            project.contentCalendar.hasEntry ||
                            project.uploads.hasUploads
                              ? "Submitted"
                              : "Pending"
                          }
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-indigo-50/50 p-4 rounded-lg">
                          <h4 className="font-medium text-indigo-900 mb-3 flex items-center">
                            <Calendar className="w-4 h-4 mr-2" /> Content
                            Calendar
                          </h4>
                          {project.contentCalendar.hasEntry ? (
                            <div className="space-y-2 text-sm">
                              <p>
                                <span className="text-gray-500">Status:</span>{" "}
                                <span className="font-medium">
                                  {project.contentCalendar.uploadStatus}
                                </span>
                              </p>
                              {project.contentCalendar.contentType && (
                                <p>
                                  <span className="text-gray-500">Type:</span>{" "}
                                  {project.contentCalendar.contentType}
                                </p>
                              )}
                              {project.contentCalendar.title && (
                                <p>
                                  <span className="text-gray-500">Title:</span>{" "}
                                  {project.contentCalendar.title}
                                </p>
                              )}
                              {project.contentCalendar.contentUploadLinks
                                ?.length > 0 && (
                                <p>
                                  <span className="text-gray-500">
                                    Content:
                                  </span>{" "}
                                  <a
                                    href={
                                      project.contentCalendar
                                        .contentUploadLinks[0]
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-500 underline"
                                  >
                                    View Link
                                  </a>
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">
                              No entry for today
                            </p>
                          )}
                        </div>

                        <div className="bg-emerald-50/50 p-4 rounded-lg">
                          <h4 className="font-medium text-emerald-900 mb-3 flex items-center">
                            <Activity className="w-4 h-4 mr-2" /> Uploads
                          </h4>
                          {project.uploads.hasUploads ? (
                            <div className="space-y-2 text-sm">
                              <p>
                                <span className="font-medium">
                                  {project.uploads.totalUploads}
                                </span>{" "}
                                items uploaded
                              </p>
                              <ul className="list-disc pl-4 text-gray-600">
                                {project.uploads.records
                                  .flatMap((r) => r.items)
                                  .map((item, i) => (
                                    <li key={i}>
                                      {item.dataType}{" "}
                                      {item.platform && (
                                        <span className="text-gray-400">
                                          ({item.platform})
                                        </span>
                                      )}
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">
                              No uploads recorded
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

          {/* Marketing Section */}
          {(department === "all" || department === "marketing") &&
            reportData.marketing.length > 0 && (
              <Section
                title="Marketing — Ad Reports"
                icon={<BarChart2 className="w-5 h-5 text-purple-600" />}
              >
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reportData.marketing.map((project) => (
                    <div
                      key={project.projectId}
                      className="border border-gray-100 bg-white rounded-lg p-5 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-900">
                          {project.projectName}
                        </h3>
                        <StatusBadge
                          status={
                            project.report.hasReport ? "Submitted" : "Pending"
                          }
                        />
                      </div>
                      {project.report.hasReport ? (
                        <div className="space-y-2 text-sm mt-4 border-t border-gray-50 pt-4">
                          {project.report.clientName && (
                            <p className="flex justify-between">
                              <span className="text-gray-500">Client:</span>{" "}
                              <span className="font-medium">
                                {project.report.clientName}
                              </span>
                            </p>
                          )}
                          {project.report.clientContactNumber && (
                            <p className="flex justify-between">
                              <span className="text-gray-500">
                                Contact No.:
                              </span>{" "}
                              <span className="font-medium font-mono">
                                {project.report.clientContactNumber}
                              </span>
                            </p>
                          )}
                          <p className="flex justify-between">
                            <span className="text-gray-500">Ad Status:</span>{" "}
                            <span
                              className={`font-medium ${project.report.isAdRunning ? "text-green-600" : "text-red-500"}`}
                            >
                              {project.report.isAdRunning
                                ? "Running"
                                : "Not Running"}
                            </span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-gray-500">Reach:</span>{" "}
                            <span className="font-medium">
                              {(
                                project.report.todayReachObtained || 0
                              ).toLocaleString()}
                            </span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-gray-500">Spend:</span>{" "}
                            <span className="font-medium">
                              ₹
                              {(
                                project.report.todayAmountSpend || 0
                              ).toLocaleString()}
                            </span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-gray-500">Leads:</span>{" "}
                            <span className="font-medium">
                              {project.report.leadObtained || 0}
                            </span>
                          </p>
                          {project.report.areaName && (
                            <p className="flex justify-between">
                              <span className="text-gray-500">Area:</span>{" "}
                              <span
                                className="font-medium truncate max-w-[120px]"
                                title={project.report.areaName}
                              >
                                {project.report.areaName}
                              </span>
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic mt-4">
                          No report for today
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

          {/* SEO Section */}
          {(department === "all" || department === "seo") &&
            reportData.seo.length > 0 && (
              <Section
                title="SEO — Daily Tracking"
                icon={<Search className="w-5 h-5 text-blue-600" />}
              >
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reportData.seo.map((project) => (
                    <div
                      key={project.projectId}
                      className="border border-gray-100 bg-white rounded-lg p-5 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-900">
                          {project.projectName}
                        </h3>
                        <StatusBadge
                          status={
                            project.report.hasReport ? "Submitted" : "Pending"
                          }
                        />
                      </div>
                      {project.report.hasReport ? (
                        <div className="space-y-2 text-sm mt-4 border-t border-gray-50 pt-4">
                          {project.report.clientContactNumber && (
                            <p className="flex justify-between">
                              <span className="text-gray-500">
                                Contact No.:
                              </span>{" "}
                              <span className="font-medium font-mono">
                                {project.report.clientContactNumber}
                              </span>
                            </p>
                          )}
                          <p>
                            <span className="text-gray-500 block mb-1">
                              Keywords:
                            </span>{" "}
                            <span className="font-medium bg-gray-100 px-2 py-1 rounded text-xs">
                              {project.report.keywords?.join(", ")}
                            </span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-gray-500">Ranking:</span>{" "}
                            <span className="font-medium text-blue-600">
                              #{project.report.rankingNo}
                            </span>
                          </p>
                          {project.report.screenshotUrl && (
                            <a
                              href={project.report.screenshotUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-center mt-3 bg-blue-50 text-blue-600 py-2 rounded-md hover:bg-blue-100 transition-colors"
                            >
                              View Screenshot
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic mt-4">
                          No report for today
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}
        </div>
      )}
    </div>
  );
};

// UI Components
const SummaryCard = ({ title, value, color }) => (
  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
    <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
    <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
  </div>
);

const Section = ({ title, icon, children }) => (
  <div className="mb-8">
    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
      {icon} {title}
    </h2>
    {children}
  </div>
);

const StatusBadge = ({ status }) => {
  const isSubmitted = status === "Submitted";
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isSubmitted ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
    >
      {status}
    </span>
  );
};

export default DailyDepartmentReportPage;
