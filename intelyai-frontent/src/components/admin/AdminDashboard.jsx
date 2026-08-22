import React, { useState } from 'react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('health');

  return (
    <div className="space-y-6">
      
      {/* Nav */}
      <div className="flex border-b border-slate-200 dark:border-dark-border gap-6 text-sm font-semibold">
        {[
          { id: 'health', label: '🖥️ System Health & Infrastructure' },
          { id: 'compliance', label: '🛡️ Compliance & Kenya DPA Logs' },
          { id: 'ai', label: '🤖 AI Model Monitoring' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-brand-blue text-brand-blue dark:border-brand-cyan dark:text-brand-cyan'
                : 'border-transparent text-slate-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* HEALTH TAB */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border">
            <span className="text-xs font-bold text-slate-500 uppercase">PostgreSQL Database</span>
            <div className="text-xl font-black text-brand-green mt-1">Healthy (12ms)</div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border">
            <span className="text-xs font-bold text-slate-500 uppercase">Qdrant Vector DB</span>
            <div className="text-xl font-black text-brand-green mt-1">Operational (45ms)</div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border">
            <span className="text-xs font-bold text-slate-500 uppercase">Redis Cache</span>
            <div className="text-xl font-black text-brand-green mt-1">Hit Rate: 98.4%</div>
          </div>
        </div>
      )}

      {/* COMPLIANCE TAB */}
      {activeTab === 'compliance' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border space-y-4">
          <h3 className="text-lg font-bold">Kenya Data Protection Act Audit Trail</h3>
          <div className="text-xs space-y-2">
            <div className="p-3 rounded bg-slate-50 dark:bg-dark-bg flex justify-between">
              <span>[2026-08-14] Consent recorded for User #usr_cand_1 (Resume Vectorization)</span>
              <span className="text-brand-green font-bold">Passed Audit</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}