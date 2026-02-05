"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, CheckCircle, Bot, ArrowRight, Copy, AlertCircle, Activity, Key } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Image from 'next/image'

interface ConnectAgentFlowProps {
  projectId: string
  onBack: () => void
  onClose: () => void
  onAgentCreated: (agentData: any) => void
  onLoadingChange: (loading: boolean) => void
}

interface TrilletWorkspace {
  _id: string;
  name: string;
}

interface TrilletAgent {
  _id: string;
  name: string;
  model?: string;
  pathway?: string;
}

const TrilletLogo = () => (
  <div className="relative w-5 h-5">
    <Image src="/trillet-logo.png" alt="Trillet" fill className="object-contain" />
  </div>
)

const ConnectAgentFlow: React.FC<ConnectAgentFlowProps> = ({
  projectId,
  onBack,
  onClose,
  onAgentCreated,
  onLoadingChange
}) => {
  const [currentStep, setCurrentStep] = useState<'form' | 'creating' | 'connecting' | 'success'>('form')
  const [activeTab, setActiveTab] = useState<'livekit' | 'trillet'>('livekit')
  
  // Trillet Integration State
  const [apiKey, setApiKey] = useState('')
  const [workspaceId, setWorkspaceId] = useState('')
  const [isValidatingKey, setIsValidatingKey] = useState(false)
  const [agents, setAgents] = useState<TrilletAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('')

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  const [error, setError] = useState<string | null>(null)
  const [createdAgentData, setCreatedAgentData] = useState<any>(null)
  const [copiedId, setCopiedId] = useState(false)

  // Fetch Agents when Keys are entered
  const handleFetchAgents = async () => {
    if (!apiKey.trim() || !workspaceId.trim()) {
      setError('Please enter both API Key and Workspace ID')
      return
    }

    setIsValidatingKey(true)
    setError(null)
    setAgents([])
    setSelectedAgent('')

    try {
      // Use internal proxy route to avoid CORS
      const response = await fetch(`/api/trillet/agents`, {
        headers: {
          'x-api-key': apiKey.trim(),
          'x-workspace-id': workspaceId.trim()
        }
      });

      if (!response.ok) {
        throw new Error('Invalid credentials or failed to fetch agents');
      }

      const data = await response.json();
      setAgents(data);
      
    } catch (err) {
      console.error('Fetch agents error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
    } finally {
      setIsValidatingKey(false)
    }
  }

  const handleAgentChange = (agentId: string) => {
    setSelectedAgent(agentId);
    const agent = agents.find(a => a._id === agentId);
    if (agent) {
      setFormData(prev => ({ ...prev, name: agent.name }));
    }
  };

  // LiveKit Agent Submit Handler
  const handleLiveKitSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError('Agent name is required')
      return
    }

    onLoadingChange(true)
    setCurrentStep('creating')

    try {
      const payload = {
        name: formData.name.trim(),
        agent_type: 'livekit',
        configuration: {
          description: formData.description.trim() || null,
        },
        project_id: projectId,
        environment: 'dev',
        platform: 'livekit'
      }

      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to setup monitoring')
      }

      const data = await response.json()
      setCreatedAgentData(data)
      setCurrentStep('success')
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to setup monitoring'
      setError(errorMessage)
      setCurrentStep('form')
    } finally {
      onLoadingChange(false)
    }
  }

  // Trillet Agent Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedAgent || !workspaceId || !apiKey) {
      setError('Please select an agent to monitor')
      return
    }

    if (!formData.name.trim()) {
      setError('Monitoring label is required')
      return
    }

    onLoadingChange(true)
    setCurrentStep('creating')

    try {
      const payload = {
        name: formData.name.trim(),
        agent_type: 'trillet',
        configuration: {
          description: formData.description.trim() || null,
          trilletApiKey: apiKey,
          trilletWorkspaceId: workspaceId,
          trilletAgentId: selectedAgent
        },
        project_id: projectId,
        environment: 'dev',
        platform: 'trillet'
      }

      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to setup monitoring')
      }

      const data = await response.json()
      
      // Register the monitoring agent with middleware
      setCurrentStep('connecting')
      try {
        // Get the selected agent's pathway ID
        const selectedAgentData = agents.find(a => a._id === selectedAgent)
        const pathwayId = selectedAgentData?.pathway
        
        if (!pathwayId) {
          console.error('No pathway ID found for selected agent')
          throw new Error('Agent does not have an associated pathway')
        }

        // Fetch the project's API keys
        const apiKeysResponse = await fetch(`/api/projects/${projectId}/api-keys`)
        
        if (!apiKeysResponse.ok) {
          console.error('Failed to fetch project API keys')
          throw new Error('Could not retrieve project API key')
        }
        
        const apiKeysData = await apiKeysResponse.json()
        const firstKey = apiKeysData.keys?.[0]
        
        if (!firstKey?.id) {
          console.error('No API key found for project')
          throw new Error('Project API key not found')
        }

        // Decrypt the API key
        const decryptResponse = await fetch(`/api/projects/${projectId}/api-keys/${firstKey.id}/decrypt`, {
          method: 'POST'
        })

        if (!decryptResponse.ok) {
          console.error('Failed to decrypt project API key')
          throw new Error('Could not decrypt project API key')
        }

        const decryptData = await decryptResponse.json()
        const decryptedApiKey = decryptData.full_key

        if (!decryptedApiKey) {
          console.error('Decrypted API key is empty')
          throw new Error('Decrypted API key not found')
        }

        const middlewareUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        const registerResponse = await fetch(`${middlewareUrl}/v1/api/call-flows/register-soundflare/${pathwayId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey.trim(),
            'x-workspace-id': workspaceId.trim(),
          },
          body: JSON.stringify({
            soundflareAgentId: data.id,
            soundflareApiKey: decryptedApiKey
          }),
        })

        if (registerResponse.ok) {
          console.log('✅ Monitoring agent registered with middleware successfully')
        } else {
          console.error('Failed to register monitoring agent with middleware')
        }
      } catch (error_) {
        console.error('Error registering with middleware:', error_)
      }
      
      setCreatedAgentData(data)
      setCurrentStep('success')
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to setup monitoring'
      setError(errorMessage)
      setCurrentStep('form')
    } finally {
      onLoadingChange(false)
    }
  }

  const handleCopyId = async () => {
    if (createdAgentData?.id) {
      try {
        await navigator.clipboard.writeText(createdAgentData.id)
        setCopiedId(true)
        setTimeout(() => setCopiedId(false), 2000)
      } catch (err) {
        console.error('Failed to copy monitoring ID:', err)
      }
    }
  }

  const handleFinish = () => {
    onAgentCreated(createdAgentData)
    onClose()
  }

  if (currentStep === 'creating' || currentStep === 'connecting') {
    return (
      <div className="px-6 py-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-50 to-teal-50 dark:from-orange-900/20 dark:to-teal-900/20 rounded-2xl flex items-center justify-center border border-neutral-100 dark:border-neutral-800">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600 dark:text-orange-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {currentStep === 'creating' ? 'Setting Up Monitoring' : 'Connecting Monitoring'}
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {currentStep === 'creating' 
            ? 'Configuring observability for your agent...' 
            : 'Establishing monitoring connection...'}
        </p>
      </div>
    )
  }

  if (currentStep === 'success') {
    const isLiveKit = createdAgentData?.platform === 'livekit' || createdAgentData?.agent_type === 'livekit'
    
    return (
      <>
        {/* Success Header */}
        <DialogHeader className="px-6 pt-6 pb-4 text-center border-b border-neutral-100 dark:border-neutral-800">
          <div className="w-12 h-12 mx-auto mb-3 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Monitoring Setup Complete!
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            "{createdAgentData?.name}" is now being observed
          </p>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                {isLiveKit ? (
                  <Bot className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                ) : (
                  <TrilletLogo />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {createdAgentData?.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                    {isLiveKit ? 'LiveKit Monitoring' : 'Trillet Monitoring'}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-gray-50 dark:bg-neutral-900/30 text-gray-600 dark:text-gray-400 border-neutral-200 dark:border-neutral-700">
                    Development
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-neutral-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Monitoring ID</span>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                  {createdAgentData?.id?.slice(0, 8)}...
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyId}
                  className="h-6 w-6 p-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
            {copiedId && (
              <p className="text-xs text-green-600 dark:text-green-400 text-right mt-1">
                Copied to clipboard
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline"
              onClick={onClose}
              className="flex-1 h-10 text-gray-700 dark:text-gray-300 border-neutral-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-800"
            >
              Monitor Another
            </Button>
            <Button 
              onClick={handleFinish}
              className="flex-1 h-10 bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white font-medium"
            >
              View Integration
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Header */}
      <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-center flex-1">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-orange-50 to-teal-50 dark:from-orange-900/20 dark:to-teal-900/20 rounded-xl flex items-center justify-center border border-neutral-100 dark:border-neutral-800">
              <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Connect Agent
            </DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add monitoring to your voice agent
            </p>
          </div>
        </div>
      </DialogHeader>

      {/* Tabs for Agent Platform */}
      <div className="px-6 pt-4">
        <div className="space-y-2">
          <div className="block text-sm font-medium text-gray-900 dark:text-gray-100">
            Agent Platform
          </div>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'livekit' | 'trillet')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-gray-100 dark:bg-neutral-800">
              <TabsTrigger 
                value="livekit" 
                className="flex flex-col items-start py-3 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="w-4 h-4" />
                  <span className="font-medium text-sm">LiveKit Agent</span>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 text-left">
                  Monitor your LiveKit voice agent
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="trillet" 
                className="flex flex-col items-start py-3 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4">
                    <TrilletLogo />
                  </div>
                  <span className="font-medium text-sm">Trillet Account</span>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 text-left">
                  Import and monitor Trillet agents
                </span>
              </TabsTrigger>
            </TabsList>

            {/* LiveKit Tab Content */}
            <TabsContent value="livekit" className="mt-6 space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="livekit-name" className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Agent Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="livekit-name"
                    placeholder="e.g. Customer Support Agent"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-10 px-3 text-sm border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg focus:border-orange-500 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-orange-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="livekit-description" className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Description <span className="text-gray-500 dark:text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="livekit-description"
                    placeholder="Brief description of what this agent does..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg focus:border-orange-500 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-orange-500/20 focus:outline-none resize-none transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Trillet Tab Content */}
            <TabsContent value="trillet" className="mt-6 space-y-6">
              {/* Step 1: Credentials */}
              <div className="space-y-3">
                <div className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  1. Enter Trillet Credentials
                </div>
                
                <div className="space-y-3">
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      type="password"
                      placeholder="Trillet API Key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="pl-9 h-10 text-sm border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg focus:border-orange-500 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-orange-500/20 transition-all"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Workspace ID"
                      value={workspaceId}
                      onChange={(e) => setWorkspaceId(e.target.value)}
                      className="h-10 text-sm border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg focus:border-orange-500 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-orange-500/20 transition-all"
                    />
                    
                    <Button 
                      onClick={handleFetchAgents}
                      disabled={!apiKey || !workspaceId || isValidatingKey}
                      variant="outline"
                      className="whitespace-nowrap min-w-[100px]"
                    >
                      {isValidatingKey ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Fetch Agents'
                      )}
                    </Button>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  You can find your API key and Workspace ID in your Trillet Dashboard settings.
                </p>
              </div>

              {/* Step 2: Select Agent */}
              {agents.length > 0 && (
                <div className="space-y-3 animate-in slide-in-from-top-2 fade-in duration-300">
                  <div className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    2. Select Agent to Monitor
                  </div>
                  <Select value={selectedAgent} onValueChange={handleAgentChange}>
                    <SelectTrigger className="w-full bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent._id} value={agent._id}>
                          {agent.name} {agent.model ? `(${agent.model})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Step 3: Configuration */}
              {selectedAgent && (
                <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 animate-in slide-in-from-top-2 fade-in duration-300">
                  <div className="space-y-2">
                    <label htmlFor="trillet-label" className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                      Monitoring Label
                    </label>
                    <Input
                      id="trillet-label"
                      placeholder="e.g. Sales Assistant Monitor"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-10 px-3 text-sm border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg focus:border-orange-500 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-orange-500/20 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="trillet-notes" className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                      Notes <span className="text-gray-500 dark:text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      id="trillet-notes"
                      placeholder="Brief description of what this agent does..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg focus:border-orange-500 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-orange-500/20 focus:outline-none resize-none transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Sticky Footer with Actions */}
      <div className="flex-shrink-0 px-6 py-4 bg-gray-50/50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 mt-6">
        <div className="flex gap-3">
          <Button 
            type="button" 
            variant="outline"
            onClick={onBack}
            className="flex-1 h-10 text-gray-700 dark:text-gray-300 border-neutral-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-800"
          >
            Back
          </Button>
          <Button 
            onClick={activeTab === 'livekit' ? handleLiveKitSubmit : handleSubmit}
            disabled={
              activeTab === 'livekit' 
                ? !formData.name.trim()
                : (!selectedAgent || !formData.name.trim())
            }
            className="flex-1 h-10 font-medium text-white bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700"
          >
            Connect Agent
          </Button>
        </div>
      </div>
    </>
  )
}

export default ConnectAgentFlow
