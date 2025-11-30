export default function HelpPage() {
  const sections = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Admin Dashboard",
      description: "The main dashboard provides a quick overview of the application's statistics.",
      color: "indigo",
      items: [
        {
          label: "Stat Cards",
          content: "Show total numbers for questions, active sessions, departments, and students."
        },
        {
          label: "Students by Department Chart",
          content: "A bar chart that visualizes the number of students in each department."
        }
      ]
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      title: "Sessions",
      description: "This section allows you to manage quiz sessions.",
      color: "blue",
      items: [
        {
          label: "Creating a Session",
          content: "Click the \"Create Session\" button and provide a name."
        },
        {
          label: "Managing a Session",
          content: "Click on a session card to go to its detailed view. From there, you can manage participants, add questions, and control the quiz flow."
        }
      ]
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      title: "Session Details & Quiz Control",
      description: "The session detail page has several tabs for managing a live quiz.",
      color: "purple",
      items: [
        {
          label: "Quiz Control Tab",
          content: "This is the main panel for running the quiz.",
          subitems: [
            "Start/Restart Quiz - Begins the quiz from the first question",
            "Next Question - Moves to the next question in the session",
            "End Quiz - Finishes the quiz and calculates final scores",
            "Reset Scores - A destructive action that permanently deletes all score records for the current session from the database. Use this if you want a clean slate"
          ]
        },
        {
          label: "Questions Tab",
          content: "Add or remove questions for the session from the main question bank."
        },
        {
          label: "Participants Tab",
          content: "View and remove participants who have joined the session."
        },
        {
          label: "Scoreboard Tab",
          content: "Shows the current leaderboard for the session, either for individuals or departments."
        },
        {
          label: "Score Over Time Tab",
          content: "Track performance throughout the quiz.",
          subitems: [
            "Individual Student Scores Chart - A multi-line chart showing the cumulative score progression for each student throughout the quiz. Each colored line represents a different student",
            "Question Breakdown Table - A detailed table showing the score awarded for each question and the time it was answered"
          ]
        }
      ]
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      title: "Departments, Students & Questions",
      description: "These sections are for managing the core data of the application.",
      color: "green",
      items: [
        {
          label: "Departments",
          content: "Add, edit, or delete departments."
        },
        {
          label: "Student Management",
          content: "Add new students and assign them to departments."
        },
        {
          label: "Questions",
          content: "Manage the global bank of questions that can be added to any quiz session."
        }
      ]
    }
  ];

  const colorClasses: Record<string, { icon: string; badge: string }> = {
    indigo: {
      icon: "bg-indigo-50 text-indigo-600",
      badge: "bg-indigo-50 text-indigo-700 border-indigo-200"
    },
    blue: {
      icon: "bg-blue-50 text-blue-600",
      badge: "bg-blue-50 text-blue-700 border-blue-200"
    },
    purple: {
      icon: "bg-purple-50 text-purple-600",
      badge: "bg-purple-50 text-purple-700 border-purple-200"
    },
    green: {
      icon: "bg-green-50 text-green-600",
      badge: "bg-green-50 text-green-700 border-green-200"
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Help & Documentation</h1>
        <p className="text-gray-600 mt-1">Complete guide to using the quiz management platform.</p>
      </div>

      <div className="space-y-4">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[section.color].icon}`}>
                  {section.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                </div>
              </div>
            </div>
            
            <div className="p-5">
              <div className="space-y-4">
                {section.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                      </div>
                      <div className="flex-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses[section.color].badge}`}>
                          {item.label}
                        </span>
                        <p className="text-sm text-gray-700 mt-2">{item.content}</p>
                        
                        {item.subitems && (
                          <div className="mt-3 space-y-2 pl-4 border-l-2 border-gray-200">
                            {item.subitems.map((subitem, subIdx) => (
                              <div key={subIdx} className="flex items-start gap-2">
                                <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <p className="text-sm text-gray-600">{subitem}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-indigo-900">Need More Help?</h3>
            <p className="text-sm text-indigo-700 mt-1">If you encounter any issues or need additional assistance, please contact your system administrator.</p>
          </div>
        </div>
      </div>
    </div>
  );
}