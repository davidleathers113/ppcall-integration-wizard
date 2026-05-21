import { useEffect, useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './components/dashboard/Dashboard'
import CampaignList from './components/campaigns/CampaignList'
import CampaignDetail from './components/campaigns/CampaignDetail'
import IntegrationList from './components/integrations/IntegrationList'
import IntegrationDetail from './components/integrations/IntegrationDetail'
import AddIntegrationWizard from './components/wizard/AddIntegrationWizard'
import BulkImport from './components/bulk-import/BulkImport'
import TestConsole from './components/test-console/TestConsole'
import AIAssistant from './components/ai-assistant/AIAssistant'
import DeveloperDocs from './components/developer/DeveloperDocs'
import ActivityHistory from './components/activity/ActivityHistory'
import PublisherSpecPage from './components/publisher-spec/PublisherSpecPage'
import type { IntegrationDirection } from './models/appTypes'
import { parseHashRoute, type HashRoute } from './utils/specRender'

interface WizardContext {
  campaignId?: string
  direction?: IntegrationDirection
}

function readHashRoute(): HashRoute | null {
  if (typeof window === 'undefined') return null
  return parseHashRoute(window.location.hash)
}

function App() {
  const [hashRoute, setHashRoute] = useState<HashRoute | null>(() => readHashRoute())
  const [currentView, setView] = useState('dashboard')
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null)
  const [wizardContext, setWizardContext] = useState<WizardContext>({})
  const [wizardReturnView, setWizardReturnView] = useState('integrations')

  useEffect(() => {
    const onHashChange = () => setHashRoute(readHashRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (hashRoute?.type === 'publisher-spec') {
    return <PublisherSpecPage slug={hashRoute.slug} sourceId={hashRoute.sourceId} />
  }

  const handleSelectCampaign = (id: string) => {
    setSelectedCampaignId(id)
    setView('campaign-detail')
  }

  const handleSelectIntegration = (id: string) => {
    setSelectedIntegrationId(id)
    setView('integration-detail')
  }

  const handleCreateIntegration = (context: WizardContext = {}) => {
    setWizardContext(context)
    if (context.campaignId) setSelectedCampaignId(context.campaignId)
    setWizardReturnView(context.campaignId ? 'campaign-detail' : 'integrations')
    setView('add-integration')
  }

  const handleSetView = (view: string) => {
    if (view === 'add-integration') {
      setWizardContext({})
      setWizardReturnView('integrations')
    }
    setView(view)
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />
      case 'campaigns':
        return <CampaignList onSelectCampaign={handleSelectCampaign} />
      case 'campaign-detail':
        return selectedCampaignId ? (
          <CampaignDetail campaignId={selectedCampaignId} onBack={() => setView('campaigns')} onCreateIntegration={handleCreateIntegration} />
        ) : <CampaignList onSelectCampaign={handleSelectCampaign} />
      case 'integrations':
        return <IntegrationList onSelectIntegration={handleSelectIntegration} />
      case 'integration-detail':
        return selectedIntegrationId ? (
          <IntegrationDetail integrationId={selectedIntegrationId} onBack={() => setView('integrations')} />
        ) : <IntegrationList onSelectIntegration={handleSelectIntegration} />
      case 'add-integration':
        return <AddIntegrationWizard initialContext={wizardContext} onComplete={(id) => id ? handleSelectIntegration(id) : setView(wizardReturnView)} />
      case 'bulk-import':
        return <BulkImport />
      case 'test-console':
        return <TestConsole />
      case 'ai-assistant':
        return <AIAssistant onComplete={handleSelectIntegration} />
      case 'developer':
        return <DeveloperDocs />
      case 'activity':
        return <ActivityHistory />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row">
      <Sidebar currentView={currentView} setView={handleSetView} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  )
}

export default App
