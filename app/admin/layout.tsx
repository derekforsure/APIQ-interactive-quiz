import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar"
import { getSession } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const adminName = session?.username || "Admin"; // Default to "Admin" if username is not found

  return (
    <SidebarProvider>
      <AppSidebar adminName={adminName} role={session?.role} />
      <main className="flex-1 w-full">
        <div className="flex flex-col">
          <div className="border-b p-4">
            <SidebarTrigger />
          </div>
          <div className="flex-1 p-6">
            {children}
          </div>
        </div>
      </main>
    </SidebarProvider>
  )
}