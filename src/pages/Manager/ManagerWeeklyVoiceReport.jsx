import React, { useState, useEffect, useRef } from "react";
import API from "../../services/api";
import { toast } from "react-toastify";
import { UploadCloud, CheckCircle, FileAudio, X, Mic, Briefcase, Send } from "lucide-react";

export default function ManagerWeeklyVoiceReport() {
  const [activeClients, setActiveClients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State to hold selected files for each client: { clientId: File }
  const [clientFiles, setClientFiles] = useState({});
  // Track which clients have been successfully submitted
  const [submittedClients, setSubmittedClients] = useState(new Set());
  
  // Track submitting state per client: { clientId: boolean }
  const [submittingClients, setSubmittingClients] = useState({});

  useEffect(() => {
    fetchActiveClients();
  }, []);

  const fetchActiveClients = async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/weekly-voice-reports/active-clients");
      setActiveClients(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load active clients");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (clientId, file) => {
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast.error("Please select a valid audio file.");
        return;
      }
      setClientFiles(prev => ({ ...prev, [clientId]: file }));
    }
  };

  const handleRemoveFile = (clientId) => {
    setClientFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[clientId];
      return newFiles;
    });
  };

  const handleSubmitSingle = async (client) => {
    const file = clientFiles[client.id];
    if (!file) {
      toast.error(`Please upload an audio file for ${client.projectName || client.clientName}`);
      return;
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - startDate) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil(days / 7);
    const year = now.getFullYear();
    const department = "Marketing"; // Fallback

    setSubmittingClients(prev => ({ ...prev, [client.id]: true }));

    const formData = new FormData();
    formData.append("audio", file);
    formData.append("department", department);
    formData.append("weekNumber", weekNumber.toString());
    formData.append("year", year.toString());
    formData.append("clients", JSON.stringify([{ id: client.id, name: client.projectName || client.clientName }]));

    try {
      await API.post("/api/weekly-voice-reports", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSubmittedClients(prev => new Set([...prev, client.id]));
      toast.success(`Report submitted for ${client.projectName || client.clientName}!`);
    } catch (error) {
      toast.error(`Failed to submit for ${client.projectName || client.clientName}`);
      console.error(error);
    } finally {
      setSubmittingClients(prev => ({ ...prev, [client.id]: false }));
    }
  };

  const allSubmitted = activeClients.length > 0 && activeClients.every(c => submittedClients.has(c.id));

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
      
      {/* Header Section */}
      <div className="bg-[#0B1120] rounded-3xl p-8 shadow-xl relative overflow-hidden flex items-center justify-between">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full mix-blend-screen filter blur-[80px] opacity-40"></div>
        <div className="absolute -bottom-32 left-10 w-64 h-64 bg-indigo-600 rounded-full mix-blend-screen filter blur-[80px] opacity-30"></div>
        
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold text-white mb-3">
            Weekly Voice Reports
          </h1>
          <p className="text-blue-100/80 text-lg max-w-xl">
            Upload and submit a voice feedback recording for each client separately.
          </p>
        </div>
        
        <div className="hidden md:flex relative z-10 w-16 h-16 bg-blue-500/20 rounded-2xl items-center justify-center border border-blue-400/30">
          <Mic className="text-blue-300 w-8 h-8" />
        </div>
      </div>

      {allSubmitted ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-xl m-6 animate-fade-in">
          <CheckCircle className="w-24 h-24 text-green-500 mb-6 drop-shadow-md" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">All Reports Submitted!</h2>
          <p className="text-gray-500 text-lg max-w-md">Thank you for submitting your weekly voice reports for all clients. Enjoy your weekend!</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Your Active Clients</h2>
              <p className="text-gray-500 mt-1">Submit a recording for each client individually.</p>
            </div>
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              {activeClients.length} Clients
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-64 bg-gray-50 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : activeClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <CheckCircle className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-lg">No active clients assigned to you right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeClients.map((client) => {
                const isSubmitted = submittedClients.has(client.id);
                const isSubmitting = submittingClients[client.id];
                const file = clientFiles[client.id];

                return (
                  <div key={client.id} className={`rounded-2xl border-2 transition-all duration-300 flex flex-col overflow-hidden ${isSubmitted ? 'border-green-100 bg-green-50/30' : file ? 'border-blue-200 bg-blue-50/20' : 'border-gray-100 bg-white hover:border-gray-200 shadow-sm'}`}>
                    
                    {/* Card Header */}
                    <div className="p-4 border-b border-gray-100/50 bg-gray-50/50 flex justify-between items-center">
                      <div className="truncate pr-2">
                        <h3 className="font-bold text-gray-800 truncate">{client.projectName || client.clientName}</h3>
                        <p className="text-xs text-gray-500 font-medium uppercase mt-0.5">{client.status || 'Active'}</p>
                      </div>
                      {isSubmitted && (
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Done
                        </span>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-center items-center text-center">
                      {isSubmitted ? (
                        <div className="text-green-500 flex flex-col items-center py-4">
                          <CheckCircle className="w-12 h-12 mb-2 opacity-80" />
                          <span className="font-medium">Successfully Submitted</span>
                        </div>
                      ) : !file ? (
                        <label className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 rounded-xl cursor-pointer transition-colors group">
                          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <span className="text-sm font-semibold text-gray-700">Upload Recording</span>
                          <span className="text-xs text-gray-400 mt-1">MP3, M4A, WAV</span>
                          <input 
                            type="file" 
                            accept="audio/*" 
                            className="hidden" 
                            onChange={(e) => handleFileSelect(client.id, e.target.files[0])}
                          />
                        </label>
                      ) : (
                        <div className="w-full flex flex-col items-center animate-fade-in relative">
                          <button 
                            onClick={() => handleRemoveFile(client.id)}
                            className="absolute -top-2 -right-2 p-1.5 bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 rounded-full transition-colors z-10"
                            title="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                            <FileAudio className="w-5 h-5" />
                          </div>
                          <p className="text-sm font-bold text-gray-800 w-full truncate px-2">{file.name}</p>
                          <p className="text-xs text-gray-500 mb-3">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                          
                          <audio 
                            controls 
                            src={URL.createObjectURL(file)} 
                            className="w-full h-8 custom-audio-player scale-90 origin-top mb-4" 
                          />

                          <button
                            onClick={() => handleSubmitSingle(client)}
                            disabled={isSubmitting}
                            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
                          >
                            {isSubmitting ? (
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                Submit Report
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
