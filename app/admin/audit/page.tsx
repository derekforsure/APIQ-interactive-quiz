'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Pagination } from '@/components/Pagination';
import { TableSkeleton } from '@/components/ui/skeletons';

interface AuditLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 25 });
  
  // Filters
  const [filterAction, setFilterAction] = useState('');
  const [filterEntityType, setFilterEntityType] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showDetails, setShowDetails] = useState<number | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL('/api/audit', window.location.origin);
      url.searchParams.append('page', currentPage.toString());
      url.searchParams.append('limit', '25');
      
      if (filterAction) url.searchParams.append('action', filterAction);
      if (filterEntityType) url.searchParams.append('entityType', filterEntityType);
      if (filterStartDate) url.searchParams.append('startDate', filterStartDate);
      if (filterEndDate) url.searchParams.append('endDate', filterEndDate);

      const res = await fetch(url.toString());
      const responseData = await res.json();

      console.log('API Response Status:', res.status);
      console.log('API Response Data:', responseData);

      if (res.ok) {
        setLogs(responseData.data.data || []);
        setPagination(responseData.data.pagination || { total: 0, totalPages: 0, limit: 25 });
      } else {
        console.error('Error fetching audit logs:', responseData);
        alert(`Failed to fetch audit logs: ${responseData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Network error fetching audit logs:', error);
      alert('Failed to fetch audit logs due to a network error.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterAction, filterEntityType, filterStartDate, filterEndDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const resetFilters = () => {
    setFilterAction('');
    setFilterEntityType('');
    setFilterStartDate('');
    setFilterEndDate('');
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = ['ID', 'User', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'Date'];
    const csvData = logs.map(log => [
      log.id,
      log.username || `User ${log.user_id}`,
      log.action,
      log.entity_type || '',
      log.entity_id || '',
      log.ip_address || '',
      new Date(log.created_at).toLocaleString()
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'bg-green-100 text-green-700';
    if (action.includes('delete')) return 'bg-red-100 text-red-700';
    if (action.includes('update')) return 'bg-blue-100 text-blue-700';
    if (action.includes('login')) return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-600 mt-1">Track all user actions and system events</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Action</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Actions</option>
              <option value="user.login">Login</option>
              <option value="user.logout">Logout</option>
              <option value="student.create">Student Create</option>
              <option value="student.update">Student Update</option>
              <option value="student.delete">Student Delete</option>
              <option value="question.create">Question Create</option>
              <option value="question.update">Question Update</option>
              <option value="question.delete">Question Delete</option>
              <option value="session.create">Session Create</option>
              <option value="session.delete">Session Delete</option>
              <option value="group.create">Group Create</option>
              <option value="group.delete">Group Delete</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Entity Type</label>
            <select
              value={filterEntityType}
              onChange={(e) => setFilterEntityType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Types</option>
              <option value="user">User</option>
              <option value="student">Student</option>
              <option value="question">Question</option>
              <option value="session">Session</option>
              <option value="group">Group</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset Filters
          </button>
          <button
            onClick={exportToCSV}
            disabled={logs.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export to CSV
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Activity Log</h2>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton />
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="mt-2 text-sm text-gray-500">No audit logs found.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.username || `User ${log.user_id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {log.entity_type && log.entity_id ? (
                          <span>
                            {log.entity_type} #{log.entity_id}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {log.ip_address || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {log.details && (
                          <button
                            onClick={() => setShowDetails(showDetails === log.id ? null : log.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {showDetails === log.id ? 'Hide' : 'Show'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {showDetails === log.id && log.details && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="text-sm">
                            <strong className="text-gray-700">Details:</strong>
                            <pre className="mt-2 p-3 bg-white rounded border border-gray-200 overflow-x-auto text-xs">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                            {log.user_agent && (
                              <div className="mt-2">
                                <strong className="text-gray-700">User Agent:</strong>
                                <p className="text-gray-600 text-xs mt-1">{log.user_agent}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && logs.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
          />
        )}
      </div>
    </div>
  );
}
