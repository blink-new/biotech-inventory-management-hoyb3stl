import { useState, useEffect } from 'react'
import { blink } from '@/blink/client'
import { InventoryProvider } from '@/contexts/InventoryContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { InventoryTable } from '@/components/inventory/InventoryTable'
import { AddItemForm } from '@/components/inventory/AddItemForm'
import { ApiDocumentation } from '@/components/api/ApiDocumentation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { 
  Bell, 
  FileText, 
  Settings, 
  User,
  LogOut
} from 'lucide-react'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading BioInventory...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center mx-auto">
                <User className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Welcome to BioInventory</h1>
                <p className="text-muted-foreground">
                  Please sign in to access your biotech inventory management system
                </p>
              </div>
              <Button onClick={() => blink.auth.login()} className="w-full">
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'inventory':
        return <InventoryTable />
      case 'add-item':
        return <AddItemForm />
      case 'alerts':
        return <AlertsPage />
      case 'reports':
        return <ReportsPage />
      case 'api':
        return <ApiDocumentation />
      case 'settings':
        return <SettingsPage />
      default:
        return <Dashboard />
    }
  }

  return (
    <InventoryProvider>
      <div className="min-h-screen bg-background">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Main Content */}
        <div className="lg:pl-64">
          {/* Top Bar */}
          <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold capitalize">
                {activeTab.replace('-', ' ')}
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Welcome, {user.email}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => blink.auth.logout()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Page Content */}
          <main className="p-4 lg:p-6">
            {renderContent()}
          </main>
        </div>
        
        <Toaster />
      </div>
    </InventoryProvider>
  )
}

// Placeholder components for other pages
function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alerts & Notifications</h1>
        <p className="text-muted-foreground">
          Monitor low stock levels and expiring items
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Alerts Coming Soon</h3>
          <p className="text-muted-foreground text-center">
            Real-time alerts for low stock and expiring items will be available in the next update.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Generate detailed reports and analytics
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Reports Coming Soon</h3>
          <p className="text-muted-foreground text-center">
            Comprehensive reporting and analytics features will be available in the next update.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your inventory management preferences
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Settings className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Settings Coming Soon</h3>
          <p className="text-muted-foreground text-center">
            User preferences and system configuration options will be available in the next update.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default App