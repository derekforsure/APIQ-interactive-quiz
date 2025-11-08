import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Help & Documentation</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>The main dashboard provides a quick overview of the application's statistics.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Stat Cards</strong>: Show total numbers for questions, active sessions, departments, and students.</li>
            <li><strong>Students by Department Chart</strong>: A bar chart that visualizes the number of students in each department.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>This section allows you to manage quiz sessions.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Creating a Session</strong>: Click the "Create Session" button and provide a name.</li>
            <li><strong>Managing a Session</strong>: Click on a session card to go to its detailed view. From there, you can manage participants, add questions, and control the quiz flow.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Details & Quiz Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>The session detail page has several tabs for managing a live quiz.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Quiz Control Tab</strong>: This is the main panel for running the quiz.
              <ul className="list-disc pl-6 mt-2">
                <li><strong>Start/Restart Quiz</strong>: Begins the quiz from the first question.</li>
                <li><strong>Next Question</strong>: Moves to the next question in the session.</li>
                <li><strong>End Quiz</strong>: Finishes the quiz and calculates final scores.</li>
                <li><strong>Reset Scores</strong>: A destructive action that permanently deletes all score records for the current session from the database. Use this if you want a clean slate.</li>
              </ul>
            </li>
            <li><strong>Questions Tab</strong>: Add or remove questions for the session from the main question bank.</li>
            <li><strong>Participants Tab</strong>: View and remove participants who have joined the session.</li>
            <li><strong>Scoreboard Tab</strong>: Shows the current leaderboard for the session, either for individuals or departments.</li>
            <li><strong>Score Over Time Tab</strong>:
              <ul className="list-disc pl-6 mt-2">
                <li><strong>Individual Student Scores Chart</strong>: A multi-line chart showing the cumulative score progression for each student throughout the quiz. Each colored line represents a different student.</li>
                <li><strong>Question Breakdown Table</strong>: A detailed table showing the score awarded for each question and the time it was answered.</li>
              </ul>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Departments, Students & Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>These sections are for managing the core data of the application.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Departments</strong>: Add, edit, or delete departments.</li>
            <li><strong>Student Management</strong>: Add new students and assign them to departments.</li>
            <li><strong>Questions</strong>: Manage the global bank of questions that can be added to any quiz session.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
