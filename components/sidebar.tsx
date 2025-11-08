import { 
  Play, 
  BadgeQuestionMark, 
  BookOpen, 
  Settings, 
  ChevronRight,
  Building2,
  BookUser,
  HelpCircle
} from "lucide-react"
import Link from "next/link"
import Image from "next/image";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Platform items
const platformItems = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: Play,
  },
  {
    title: "Questions",
    url: "/admin/questions",
    icon: BadgeQuestionMark,
  },
  {
    title: "Sessions",
    url: "/admin/sessions",
    icon: BookOpen,
  },
  { title: "Students",
    url: "/admin/studentmag",
    icon: BookUser
  },
  {
    title: "Department",
    url: "/admin/departments",
    icon: Building2,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
  },
  {
    title: "Help",
    url: "/admin/help",
    icon: HelpCircle,
  },
]

interface AppSidebarProps {
  adminName: string;
}

export function AppSidebar({ adminName }: AppSidebarProps) {
  return (
    <Sidebar className="bg-white text-gray-900">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Image src="/icon.svg" alt="APIQ Logo" width={32} height={32} />
          <div>
            <div className="font-semibold text-gray-900">APIQ Admin</div>
            <div className="text-sm text-gray-600">Quiz Platform</div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-600 ml-auto" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-600 text-sm font-medium mb-2">
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover:bg-gray-100 text-gray-700 hover:text-gray-900">
                    <Link href={item.url} className="flex items-center gap-2 px-2 py-2">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">{adminName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900">{adminName}</div>
            <div className="text-sm text-gray-600">Administrator</div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}