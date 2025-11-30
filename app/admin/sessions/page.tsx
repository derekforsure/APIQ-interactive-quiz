'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import SessionCard from '@/components/SessionCard';

interface Session {
  id: string;
  name: string;
  created_at: string;
  is_active: number;
  participant_count?: number;
  question_count?: number;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const router = useRouter();

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sessions');
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const result = await response.json();
      // Handle both old format (array) and new format ({ data: array })
      const data: Session[] = Array.isArray(result) ? result : result.data || [];
      setSessions(data);
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = newSessionName.trim();

    if (!trimmedName) {
      alert("Session name cannot be empty.");
      return;
    }

    if (sessions.some((session) => session.name === trimmedName)) {
      alert("A session with this name already exists.");
      return;
    }

    try {
      const response = await fetch("/api/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (!response.ok) {
        let errorMessage = `Error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Not a JSON response
        }
        throw new Error(errorMessage);
      }

      setShowCreateModal(false);
      setNewSessionName("");
      fetchSessions();
    } catch (err) {
      alert(`Failed to create session: ${(err as Error).message}`);
      console.error("Error creating session:", err);
    }
  };

  const handleToggleActive = async (sessionId: string, isActive: boolean) => {
    const action = isActive ? "activate" : "deactivate";
    if (action === 'deactivate' && !confirm('Are you sure you want to deactivate this session?')) {
      return;
    }

    try {
      const response = await fetch('/api/sessions/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId, is_active: isActive }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update session');
      }

      fetchSessions();
    } catch (err) {
      alert(`Failed to ${action} session: ${(err as Error).message}`);
      console.error(`Error ${action} session:`, err);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/sessions/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete session');
      }

      fetchSessions();
    } catch (err) {
      alert(`Failed to delete session: ${(err as Error).message}`);
      console.error('Error deleting session:', err);
    }
  };

  const showQrCode = (sessionId: string) => {
    const url = `${window.location.origin}/join?session_id=${sessionId}`;
    setQrCodeValue(url);
    setCopySuccess(false);
  };

  const closeQrModal = () => {
    setQrCodeValue(null);
  };

  const handleCopyLink = async () => {
    if (qrCodeValue) {
      try {
        await navigator.clipboard.writeText(qrCodeValue);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy: ', err);
        alert('Failed to copy the link.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quiz Sessions</h1>
        <p className="text-gray-600 mt-1">Manage active and past quiz sessions.</p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">All Sessions</h2>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Session
          </button>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-sm text-gray-500">Loading sessions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-2 text-sm text-red-600">Error: {error}</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">No sessions created yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Create your first session
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {sessions.map((session) => (
                <SessionCard 
                  key={session.id} 
                  session={session} 
                  onShowQr={showQrCode} 
                  onToggleActive={handleToggleActive} 
                  onDelete={handleDelete} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={() => setShowCreateModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl transform transition-all max-w-md w-full">
            <form onSubmit={createSession}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-gray-900">Create New Session</h3>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Session Name</label>
                  <input
                    type="text"
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    placeholder="Enter session name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrCodeValue && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={closeQrModal}></div>
          <div className="relative bg-white rounded-lg shadow-xl transform transition-all max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-900">Scan to Join Session</h3>
                <button
                  onClick={closeQrModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex justify-center mb-5 p-4 bg-gray-50 rounded-lg">
                <QRCodeSVG value={qrCodeValue} size={240} level="H" includeMargin={true} />
              </div>
              
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Session Link</label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-700 break-all">{qrCodeValue}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  {copySuccess ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Link
                    </>
                  )}
                </button>
                <button
                  onClick={closeQrModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}