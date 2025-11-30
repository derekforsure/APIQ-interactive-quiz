'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { TableSkeleton } from '@/components/ui/skeletons';
import { Pagination } from '@/components/Pagination';

interface Student {
  id: number;
  student_id: string;
  name: string;
  department: string;
  image_url: string;
  is_active: number;
}

interface Department {
  id: number;
  name: string;
}

export default function StudentManagementPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ student_id: '', name: '', department_id: '' });
  const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | 'all'>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 20 });
  const searchParams = useSearchParams();
  const departmentId = searchParams.get('departmentId');

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL('/api/students', window.location.origin);
      url.searchParams.append('page', currentPage.toString());
      url.searchParams.append('limit', '20');
      
      if (filterStatus === 'active') {
        url.searchParams.append('is_active', '1');
      } else if (filterStatus === 'inactive') {
        url.searchParams.append('is_active', '0');
      } else if (filterStatus === 'all') {
        url.searchParams.append('is_active', 'all');
      }

      if (departmentId) {
        url.searchParams.append('departmentId', departmentId);
      }

      const res = await fetch(url.toString());
      const responseData = await res.json();

      if (res.ok) {
        setStudents(responseData.data.data || []);
        setPagination(responseData.data.pagination || { total: 0, totalPages: 0, limit: 20 });
      } else {
        console.error('Error fetching students:', responseData);
        setStudents([]);
        alert(`Failed to fetch students: ${responseData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Network or parsing error fetching students:', error);
      setStudents([]);
      alert('Failed to fetch students due to a network error.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, departmentId, currentPage]);

  async function fetchDepartments() {
    const res = await fetch('/api/departments');
    const data = await res.json();
    setDepartments(data.data);
  }

  useEffect(() => {
    fetchStudents();
    fetchDepartments();
  }, [fetchStudents]);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to deactivate this student?')) {
      try {
        const res = await fetch('/api/students/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });

        if (res.ok) {
          fetchStudents();
        } else {
          const errorResponse = await res.json();
          console.error('Error deleting student:', errorResponse);
          let errorMessage = `Failed to delete student: ${errorResponse.message || 'Unknown error'}`;

          if (errorResponse.errors) {
            const fieldErrors = Object.values(errorResponse.errors).flat();
            if (fieldErrors.length > 0) {
              errorMessage += `\nDetails: ${fieldErrors.join(', ')}`;
            }
          }
          alert(errorMessage);
        }
      } catch (error) {
        console.error('Network or parsing error deleting student:', error);
        alert('Failed to delete student due to a network error.');
      }
    }
  };

  const handleActivate = async (id: number) => {
    if (confirm('Are you sure you want to activate this student?')) {
      try {
        const res = await fetch('/api/students/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });

        if (res.ok) {
          fetchStudents();
        } else {
          const errorResponse = await res.json();
          console.error('Error activating student:', errorResponse);
          let errorMessage = `Failed to activate student: ${errorResponse.message || 'Unknown error'}`;

          if (errorResponse.errors) {
            const fieldErrors = Object.values(errorResponse.errors).flat();
            if (fieldErrors.length > 0) {
              errorMessage += `\nDetails: ${fieldErrors.join(', ')}`;
            }
          }
          alert(errorMessage);
        }
      } catch (error) {
        console.error('Network or parsing error activating student:', error);
        alert('Failed to activate student due to a network error.');
      }
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.department_id) {
      alert('Please select a department.');
      return;
    }

    const studentDataToSend = {
      ...newStudent,
      department_id: parseInt(newStudent.department_id, 10),
    };

    console.log('Adding student:', studentDataToSend);
    const res = await fetch('/api/students/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentDataToSend),
    });

    if (res.ok) {
      fetchStudents();
      setShowModal(false);
      setNewStudent({ student_id: '', name: '', department_id: '' });
    } else {
      const errorResponse = await res.json();
      console.error('Error adding student:', errorResponse);
      let errorMessage = `Failed to add student: ${errorResponse.message || 'Unknown error'}`;

      if (errorResponse.errors) {
        const fieldErrors = Object.values(errorResponse.errors).flat();
        if (fieldErrors.length > 0) {
          errorMessage += `\nDetails: ${fieldErrors.join(', ')}`;
        }
      }
      alert(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
        <p className="text-gray-600 mt-1">Manage student accounts and performance.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Student Database</h2>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'active' | 'inactive' | 'all')}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="active">Active Students</option>
              <option value="inactive">Inactive Students</option>
              <option value="all">All Students</option>
            </select>
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Student
          </button>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton />
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <p className="mt-2 text-sm text-gray-500">No students found.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className={`transition-colors ${student.is_active === 0 ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100">
                        {student.student_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {student.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${
                        student.is_active === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {student.is_active === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {student.is_active === 1 ? (
                        <button 
                          onClick={() => handleDelete(student.id)} 
                          className="text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleActivate(student.id)} 
                          className="text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {!loading && students.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
          />
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl transform transition-all max-w-lg w-full">
            <form onSubmit={handleAddStudent}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-gray-900">Add New Student</h3>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Student ID</label>
                    <input 
                      type="text" 
                      placeholder="Enter student ID" 
                      value={newStudent.student_id} 
                      onChange={(e) => setNewStudent({ ...newStudent, student_id: e.target.value })} 
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                      required 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter student name" 
                      value={newStudent.name} 
                      onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} 
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                      required 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                    <select 
                      value={newStudent.department_id} 
                      onChange={(e) => setNewStudent({ ...newStudent, department_id: e.target.value })} 
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white" 
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}