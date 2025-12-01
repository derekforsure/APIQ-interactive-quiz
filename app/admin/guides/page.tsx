'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Play, Settings } from "lucide-react";

export default function GuidesPage() {
  const guides = [
    {
      title: "Getting Started",
      icon: BookOpen,
      description: "Learn the basics of the APIQuiz platform.",
      content: (
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Overview of the dashboard</li>
          <li>Understanding roles (Admin vs Organizer)</li>
          <li>Navigating the interface</li>
        </ul>
      )
    },
    {
      title: "Managing Students",
      icon: Users,
      description: "How to add, organize, and manage students.",
      content: (
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Adding individual students</li>
          <li>Creating student groups</li>
          <li>Managing student status</li>
        </ul>
      )
    },
    {
      title: "Running Sessions",
      icon: Play,
      description: "Everything you need to know about quiz sessions.",
      content: (
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Creating a new session</li>
          <li>Controlling the game flow</li>
          <li>Understanding scoring modes</li>
        </ul>
      )
    },
    {
      title: "Platform Settings",
      icon: Settings,
      description: "Configuring the platform for your needs.",
      content: (
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Managing your profile</li>
          <li>Subscription details</li>
          <li>System preferences</li>
        </ul>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Guides</h1>
        <p className="text-gray-600 mt-1">Documentation and help resources for administrators and organizers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {guides.map((guide, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <guide.icon className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle className="text-xl">{guide.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">{guide.description}</p>
              {guide.content}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
