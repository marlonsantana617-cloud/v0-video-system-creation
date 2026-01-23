"use client"

import { ConfigProvider } from "@/lib/config-context"
import { AdminPanel } from "@/components/admin/admin-panel"

export default function AdminPage() {
  return (
    <ConfigProvider>
      <AdminPanel />
    </ConfigProvider>
  )
}
