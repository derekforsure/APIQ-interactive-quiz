'use client';

import { useEffect, useState, useCallback } from 'react';
import { TableSkeleton } from '@/components/ui/skeletons';

interface Question {
  id: number;
  text: string;
  answer: string;
  incorrect_option_1: string | null;
  incorrect_option_2: string | null;
  incorrect_option_3: string | null;
  category: string;
  difficulty: number;
  topic: string;
  question_type: string;
  created_at: string;
  is_active: number;
}

const categories = [
  'General Knowledge',
  'English',
  'Math',
  'Social Study',
  'IT'
];

const difficultyColors = {
  1: 'bg-emerald-50 text-emerald-700',
  2: 'bg-amber-50 text-amber-700',
  3: 'bg-rose-50 text-rose-700'
};

const categoryColors: Record<string, string> = {
  'General Knowledge': 'bg-indigo-50 text-indigo-700',
  'English': 'bg-purple-50 text-purple-700',
  'Math': 'bg-blue-50 text-blue-700',
  'Social Study': 'bg-pink-50 text-pink-700',
  'IT': 'bg-cyan-50 text-cyan-700'
};

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    answer: '',
    incorrect_option_1: '',
    incorrect_option_2: '',
    incorrect_option_3: '',
    category: 'General Knowledge',
    difficulty: 1,
    topic: 'General',
    question_type: 'text',
  });

  const fetchQuestions = useCallback(async () => {
    const url = selectedCategory === 'all' 
      ? '/api/questions' 
      : `/api/questions?category=${encodeURIComponent(selectedCategory)}`;
    
    try {
      setLoading(true);
      const res = await fetch(url);
      const responseData = await res.json();

      if (res.ok) {
        setQuestions(responseData.data || []);
      } else {
        console.error('Error fetching questions:', responseData);
        setQuestions([]);
        alert(`Failed to fetch questions: ${responseData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Network or parsing error fetching questions:', error);
      setQuestions([]);
      alert('Failed to fetch questions due to a network error.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this question?')) {
      const res = await fetch('/api/questions/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        fetchQuestions();
      }
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setNewQuestion({
      text: question.text,
      answer: question.answer,
      incorrect_option_1: question.incorrect_option_1 || '',
      incorrect_option_2: question.incorrect_option_2 || '',
      incorrect_option_3: question.incorrect_option_3 || '',
      category: question.category,
      difficulty: question.difficulty,
      topic: question.topic,
      question_type: question.question_type,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const questionData = {
      ...newQuestion,
      incorrect_option_1: newQuestion.incorrect_option_1.trim() !== '' ? newQuestion.incorrect_option_1.trim() : null,
      incorrect_option_2: newQuestion.incorrect_option_2.trim() !== '' ? newQuestion.incorrect_option_2.trim() : null,
      incorrect_option_3: newQuestion.incorrect_option_3.trim() !== '' ? newQuestion.incorrect_option_3.trim() : null,
    };
    
    const url = editingQuestion ? '/api/questions/update' : '/api/questions';
    const method = editingQuestion ? 'PUT' : 'POST';
    const body = editingQuestion 
      ? { ...questionData, id: editingQuestion.id }
      : questionData;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      fetchQuestions();
      setShowModal(false);
      setEditingQuestion(null);
      setNewQuestion({
        text: '',
        answer: '',
        incorrect_option_1: '',
        incorrect_option_2: '',
        incorrect_option_3: '',
        category: 'General Knowledge',
        difficulty: 1,
        topic: 'General',
        question_type: 'text',
      });
    } else {
      const error = await res.json();
      alert(`Failed to ${editingQuestion ? 'update' : 'add'} question: ${error.message}`);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingQuestion(null);
    setNewQuestion({
      text: '',
      answer: '',
      incorrect_option_1: '',
      incorrect_option_2: '',
      incorrect_option_3: '',
      category: 'General Knowledge',
      difficulty: 1,
      topic: 'General',
      question_type: 'text',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Questions Management</h1>
        <p className="text-gray-600 mt-1">Manage your quiz questions here.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Question Library</h2>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Question
          </button>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton />
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">No questions found for the selected category.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Question
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Answer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incorrect Option 1
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incorrect Option 2
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incorrect Option 3
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {questions.map((question) => (
                  <tr key={question.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate font-medium" title={question.text}>
                        {question.text}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="max-w-xs truncate" title={question.answer}>
                        {question.answer}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="max-w-xs truncate" title={question.incorrect_option_1 || ''}>
                        {question.incorrect_option_1}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="max-w-xs truncate" title={question.incorrect_option_2 || ''}>
                        {question.incorrect_option_2}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="max-w-xs truncate" title={question.incorrect_option_3 || ''}>
                        {question.incorrect_option_3}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[question.category] || 'bg-gray-100 text-gray-700'}`}>
                        {question.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[question.difficulty as keyof typeof difficultyColors]}`}>
                        {question.difficulty === 1 ? 'Easy' : question.difficulty === 2 ? 'Medium' : 'Hard'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {question.question_type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(question)} 
                        className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(question.id)} 
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
          <div className="relative bg-white rounded-lg shadow-xl transform transition-all max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingQuestion ? 'Edit Question' : 'Add New Question'}
                  </h3>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Question Text</label>
                    <textarea
                      value={newQuestion.text}
                      onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      rows={3}
                      required
                      placeholder="Enter the question text..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Answer</label>
                    <textarea
                      value={newQuestion.answer}
                      onChange={(e) => setNewQuestion({ ...newQuestion, answer: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      rows={2}
                      required
                      placeholder="Enter the correct answer..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                      <select
                        value={newQuestion.category}
                        onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        required
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Difficulty</label>
                      <select
                        value={newQuestion.difficulty}
                        onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      >
                        <option value={1}>Easy (1)</option>
                        <option value={2}>Medium (2)</option>
                        <option value={3}>Hard (3)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Question Type</label>
                      <select
                        value={newQuestion.question_type}
                        onChange={(e) => {
                          const newType = e.target.value;
                          setNewQuestion({ 
                            ...newQuestion, 
                            question_type: newType
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      >
                        <option value="text">Text</option>
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="true_false">True/False</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Topic</label>
                      <input
                        type="text"
                        value={newQuestion.topic}
                        onChange={(e) => setNewQuestion({ ...newQuestion, topic: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Enter topic (optional)"
                      />
                    </div>
                  </div>

                  {newQuestion.question_type === 'multiple_choice' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Incorrect Option 1</label>
                        <input
                          type="text"
                          value={newQuestion.incorrect_option_1}
                          onChange={(e) => setNewQuestion({ ...newQuestion, incorrect_option_1: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          placeholder="Enter incorrect option 1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Incorrect Option 2</label>
                        <input
                          type="text"
                          value={newQuestion.incorrect_option_2}
                          onChange={(e) => setNewQuestion({ ...newQuestion, incorrect_option_2: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          placeholder="Enter incorrect option 2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Incorrect Option 3</label>
                        <input
                          type="text"
                          value={newQuestion.incorrect_option_3}
                          onChange={(e) => setNewQuestion({ ...newQuestion, incorrect_option_3: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          placeholder="Enter incorrect option 3"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingQuestion ? 'Update' : 'Add'} Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}