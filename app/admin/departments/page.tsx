'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { TableSkeleton } from '@/components/ui/skeletons';

interface Department {
  id: number;
  name: string;
  student_count: number;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [newDepartmentName, setNewDepartmentName] = useState('');

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/departments');
      const responseData = await res.json();
      if (res.ok) {
        setDepartments(responseData.data || []);
      } else {
        console.error('Error fetching departments:', responseData);
        alert(`Failed to fetch departments: ${responseData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Network or parsing error fetching departments:', error);
      alert('Failed to fetch departments due to a network error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this department?')) {
      const res = await fetch('/api/departments/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        fetchDepartments();
      } else {
        const error = await res.json();
        alert(`Failed to delete department: ${error.message}`);
      }
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setNewDepartmentName(department.name);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const url = editingDepartment ? '/api/departments/update' : '/api/departments';
    const method = editingDepartment ? 'PUT' : 'POST';
    const body = editingDepartment 
      ? { id: editingDepartment.id, name: newDepartmentName }
      : { name: newDepartmentName };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      fetchDepartments();
      closeModal();
    } else {
      const error = await res.json();
      alert(`Failed to ${editingDepartment ? 'update' : 'add'} department: ${error.message}`);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDepartment(null);
    setNewDepartmentName('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Departments Management</h1>
        <p className="text-gray-600 mt-1">Manage your departments here.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Department List</h2>
          <button 
            onClick={() => setShowModal(true)} 
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Department
          </button>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton />
          ) : departments.length === 0 ? (
            <div className="text-center py-12">
              <p className="mt-2 text-sm text-gray-500">No departments found.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departments.map((department) => (
                  <tr key={department.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {department.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{department.student_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/admin/studentmag?departmentId=${department.id}`} className="text-indigo-600 hover:text-indigo-900">
                        View Students
                      </Link>
                      <button 
                        onClick={() => handleEdit(department)} 
                        className="ml-4 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(department.id)} 
                        className="ml-2 text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={closeModal}></div>
          <div className="relative bg-white rounded-lg shadow-xl transform transition-all max-w-md w-full">
            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-5">
                  {editingDepartment ? 'Edit Department' : 'Add New Department'}
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Department Name</label>
                  <input
                    type="text"
                    value={newDepartmentName}
                    onChange={(e) => setNewDepartmentName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                    placeholder="Enter department name"
                  />
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                  {editingDepartment ? 'Update' : 'Add'} Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
