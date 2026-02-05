import { useState, useEffect, useRef, useCallback } from 'react'

interface WebCallState {
  isCallActive: boolean
  isMuted: boolean
  callId: string | null
  callStatus: 'idle' | 'connecting' | 'active' | 'ending' | 'error'
  error: string | null
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    transcript: string
    timestamp: Date
  }>
  currentPartialTranscript: { role: 'user' | 'assistant' | null; text: string }
}

interface UseWebCallOptions {
  agentId: string
  apiKey: string
  onCallStart?: (callId: string) => void
  onCallEnd?: (callId: string, reason: string) => void
  onTranscript?: (transcript: string, role: 'user' | 'assistant') => void
  onError?: (error: string) => void
}

export const useWebCall = ({
  agentId,
  apiKey,
  onCallStart,
  onCallEnd,
  onTranscript,
  onError
}: UseWebCallOptions) => {
  const [state, setState] = useState<WebCallState>({
    isCallActive: false,
    isMuted: false,
    callId: null,
    callStatus: 'idle',
    error: null,
    messages: [],
    currentPartialTranscript: { role: null, text: '' }
  })

  const clientRef = useRef<any>(null)
  const isInitialized = useRef(false)
  const partialTranscriptTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize Trillet client
  const initializeClient = useCallback(async () => {
    console.log('🔄 initializeClient called, checking initialization status...')
    if (isInitialized.current) {
      console.log('🔄 Client already initialized, skipping...')
      return
    }

    if (clientRef.current) {
      console.log('🔄 Client instance already exists, skipping...')
      return
    }

    try {
      console.log('🚀 Starting client initialization...')
      console.log('🔑 API Key (first 8 chars):', apiKey.slice(0, 8) + '...')
      console.log('🎯 Agent ID:', agentId)

      if (!apiKey || apiKey.trim() === '') {
        throw new Error('API key is empty or undefined')
      }

      if (!agentId || agentId.trim() === '') {
        throw new Error('Agent ID is empty or undefined')
      }

      // TODO: Initialize Trillet SDK when available
      // For now, this is a placeholder for the @trillet-ai/web-sdk integration
      console.log('⚠️ Trillet SDK integration pending')

      isInitialized.current = true
      console.log('✅ Client initialized successfully')

    } catch (error) {
      console.error('❌ Failed to initialize client:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize client'

      // Clean up on error
      if (clientRef.current) {
        console.log('🧹 Cleaning up client instance due to error')
        clientRef.current = null
      }
      isInitialized.current = false

      setState(prev => ({ ...prev, error: errorMessage }))
      onError?.(errorMessage)
    }
  }, [apiKey, agentId, onError])

  // Start a call
  const startCall = useCallback(async () => {
    console.log('🚀 startCall function called')
    console.log('🎯 Target agent ID:', agentId)

    if (!clientRef.current) {
      console.log('🔄 Client not initialized, calling initializeClient...')
      await initializeClient()
    }

    try {
      console.log('📊 Setting call status to connecting...')
      setState(prev => ({ ...prev, callStatus: 'connecting', error: null }))
      console.log('✅ Call status set to connecting')

      // TODO: Implement Trillet SDK call start when available
      console.log('⚠️ Call start implementation pending - Trillet SDK integration needed')

      // Placeholder: Simulate successful connection
      setState(prev => ({
        ...prev,
        callStatus: 'active',
        isCallActive: true,
        callId: `call_${Date.now()}`
      }))

    } catch (error) {
      console.error('❌ Failed to start call')
      const errorMessage = error instanceof Error ? error.message : 'Failed to start call'
      console.log('📝 Setting error state with message:', errorMessage)

      setState(prev => ({
        ...prev,
        callStatus: 'error',
        error: errorMessage
      }))

      console.log('📞 Calling onError callback')
      onError?.(errorMessage)
      throw error
    }
  }, [agentId, initializeClient, onError])

  // End the current call
  const endCall = useCallback(async () => {
    if (!state.isCallActive) return

    try {
      setState(prev => ({ ...prev, callStatus: 'ending' }))
      console.log('🛑 Ending call')

      // TODO: Implement Trillet SDK call end when available

      setState(prev => ({
        ...prev,
        callStatus: 'idle',
        isCallActive: false,
        callId: null
      }))

    } catch (error) {
      console.error('❌ Error ending call:', error)
      // Still reset state even if stop fails
      setState(prev => ({
        ...prev,
        callStatus: 'idle',
        isCallActive: false,
        callId: null
      }))
    }
  }, [state.isCallActive])

  // Toggle mute
  const toggleMute = useCallback(() => {
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }))
    console.log('🔇 Mute toggled:', !state.isMuted)
    // TODO: Implement actual mute functionality with Trillet SDK
  }, [state.isMuted])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Reset state
  const reset = useCallback(() => {
    setState({
      isCallActive: false,
      isMuted: false,
      callId: null,
      callStatus: 'idle',
      error: null,
      messages: [],
      currentPartialTranscript: { role: null, text: '' }
    })
  }, [])

  // Initialize on mount
  useEffect(() => {
    console.log('🔄 useEffect triggered - initializing client')
    initializeClient()

    return () => {
      console.log('🧹 Cleanup function called')
      // Cleanup
      if (clientRef.current) {
        console.log('🛑 Cleaning up client instance')
        clientRef.current = null
      }

      // Clear any pending timeout
      if (partialTranscriptTimeoutRef.current) {
        clearTimeout(partialTranscriptTimeoutRef.current)
        partialTranscriptTimeoutRef.current = null
      }
    }
  }, [initializeClient])

  return {
    ...state,
    startCall,
    endCall,
    toggleMute,
    clearError,
    reset,
    isInitialized: isInitialized.current
  }
}
