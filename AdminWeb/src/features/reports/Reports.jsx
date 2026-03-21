import React, { useState, useEffect } from 'react';
import { DownloadCloud, FileText } from 'lucide-react';
import apiClient from '../../services/apiClient';

const Reports = () => {
  const [reportsList, setReportsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

// Reports.jsx chunk 1
  useEffect(() => {
    apiClient.get('/admin/reports')
      .then(res => setReportsList(res.data))
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/40 p-6 md:p-8 rounded-3xl shadow-lg shadow-slate-200/50 animate-fade-in-up">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl mr-3 border border-indigo-100">
             <FileText size={24} strokeWidth={2} />
          </div>
          System Reports & Exports
        </h2>
        <p className="text-sm text-slate-500 mt-2">Download raw database snapshots for archival.</p>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-10 text-slate-400 font-medium">Loading reports...</div>
        ) : reportsList.map(report => (
          <div key={report._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-200 transition-all duration-300 gap-4 sm:gap-0">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{report.name}</h3>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mr-2">{report.date}</span> 
                {report.size}
              </p>
            </div>
            <button className="flex items-center text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-200 hover:shadow-lg w-full sm:w-auto justify-center">
              <DownloadCloud size={18} strokeWidth={2.5} className="mr-2" />
              Download CSV
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
