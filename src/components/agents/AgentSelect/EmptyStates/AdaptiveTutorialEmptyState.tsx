import React, { useState } from 'react'
import { Copy, Terminal, ChevronDown, ChevronUp, Eye, AlertTriangle, Play, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMobile } from '@/hooks/use-mobile'
import Image from 'next/image'

interface AdaptiveTutorialEmptyStateProps {
  searchQuery: string
  totalAgents: number
  onClearSearch: () => void
  onCreateAgent: () => void
}

const TrilletLogo = () => (
  <div className="relative w-6 h-6">
    <Image src="/trillet-logo.png" alt="Trillet" fill className="object-contain" />
  </div>
)

// Complete agent code example - update this constant to change the code throughout the component
const COMPLETE_AGENT_CODE = `
import os
import logging
from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
)
from livekit.plugins import openai, elevenlabs, silero
from soundflare import LivekitObserve
load_dotenv()

logger = logging.getLogger("simple-agent")

# Initialize SoundFlare
trillet_evals = LivekitObserve(
    agent_id="agent_id_here",  # Replace with your actual agent ID
    apikey=os.getenv("TRILLET_EVALS_API_KEY") # Put this in .env file
)

class MyVoiceAgent(Agent):
    def __init__(self):
        super().__init__(
            instructions="You are a helpful voice assistant. Keep responses concise and friendly."
        )

    async def on_enter(self):
        # Generate initial reply when agent joins
        self.session.say("Hello! I'm here. How can I help you today?")

def prewarm(proc: JobProcess):
    # Preload VAD model for better performance
    proc.userdata["vad"] = silero.VAD.load()

async def entrypoint(ctx: JobContext):
    session = AgentSession(
        vad=ctx.proc.userdata["vad"],
        llm=openai.LLM(model="gpt-4o-mini"),
        stt=openai.STT(),  # Using OpenAI STT
        tts=elevenlabs.TTS(
            voice_id="eleven_labs_voice_id",  # Replace with your ElevenLabs voice ID
            model="eleven_flash_v2_5"
        ),
    )
    
    # Start SoundFlare monitoring
    session_id = trillet_evals.start_session(
        session=session,
        phone_number="+1234567890"  # Optional data
    )
    
    # Export monitoring data when session ends
    async def trillet_evals_shutdown():
        await trillet_evals.export(session_id)
    
    ctx.add_shutdown_callback(trillet_evals_shutdown)
    
    # Start the session
    await session.start(
        agent=MyVoiceAgent(),
        room=ctx.room
    )

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
`;

const AdaptiveTutorialEmptyState: React.FC<AdaptiveTutorialEmptyStateProps> = ({
  searchQuery,
  totalAgents,
  onClearSearch,
  onCreateAgent
}) => {
  const [experienceLevel, setExperienceLevel] = useState<'unknown' | 'beginner' | 'experienced'>('unknown')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [expandedExample, setExpandedExample] = useState(false)
  const [dismissedNotices, setDismissedNotices] = useState<Set<string>>(new Set())
  const { isMobile } = useMobile(768)

  const copyToClipboard = (text: string, codeId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(codeId)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const dismissNotice = (noticeId: string) => {
    setDismissedNotices(prev => new Set([...prev, noticeId]))
  }

  // No search results - same as before
  if (searchQuery && totalAgents > 0) {
    return (
      <div className={`text-center py-12 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 ${isMobile ? 'px-4' : ''}`}>
        <div className="w-12 h-12 bg-gray-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Eye className="h-6 w-6 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">No Results Found</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
          No monitoring setups match your search criteria.
        </p>
        <Button 
          variant="outline" 
          onClick={onClearSearch}
          size="sm"
          className="border-neutral-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300"
        >
          Clear Search
        </Button>
      </div>
    )
  }

  if (experienceLevel === 'unknown') {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <div className={`text-center py-6 ${isMobile ? 'px-4' : 'px-6'}`}>
          <div className="w-12 h-12 bg-blue-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Eye className="h-6 w-6 text-blue-600 dark:text-orange-400" />
          </div>
          <h2 className={`font-semibold text-gray-900 dark:text-gray-100 mb-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
            Start Monitoring Your Voice Agents
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-lg mx-auto">
            Add intelligent observability to your voice AI agents
          </p>
          
          <div className="max-w-md mx-auto">
            <div 
              onClick={onCreateAgent}
              className="group p-6 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-blue-400 dark:hover:border-orange-500 hover:bg-blue-50/50 dark:hover:bg-orange-950/10 cursor-pointer transition-all"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrilletLogo />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Connect your Trillet Account</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
                Link your Trillet account to automatically import and monitor your voice agents.
              </p>
              <div className="inline-flex items-center text-blue-600 dark:text-orange-400 font-medium text-sm">
                Connect Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Beginner tutorial - Mobile optimized
  if (experienceLevel === 'beginner') {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <div className={isMobile ? 'p-4' : 'p-6'}>
          <div className={`flex items-center justify-between mb-4 ${isMobile ? 'flex-col gap-3' : ''}`}>
            <div className={isMobile ? 'text-center' : ''}>
              <h2 className={`font-semibold text-gray-900 dark:text-gray-100 mb-1 ${isMobile ? 'text-base' : 'text-lg'}`}>
                Complete LiveKit Agent Tutorial
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Build your first voice AI agent with monitoring</p>
            </div>
            <div className={`flex items-center gap-2 ${isMobile ? 'flex-col w-full' : ''}`}>
              <a
                href="https://youtu.be/1POj8h99xnE"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 px-2 py-1.5 rounded-lg transition-all ${isMobile ? 'w-full justify-center' : ''}`}
              >
                <Play className="w-3 h-3" />
                Video tutorial
              </a>
              <Button 
                variant="outline" 
                onClick={() => setExperienceLevel('unknown')}
                size="sm"
                className={`text-gray-600 dark:text-gray-400 border-neutral-300 dark:border-neutral-600 text-xs ${isMobile ? 'w-full' : ''}`}
              >
                ← Back
              </Button>
            </div>
          </div>

          {/* Important Notice - More compact on mobile */} 
          {!dismissedNotices.has('beginner-agent-id') && (
            <div className="bg-blue-50 dark:bg-orange-900/20 border border-blue-200 dark:border-orange-800 rounded-lg p-3 mb-4 relative">
              <button
                onClick={() => dismissNotice('beginner-agent-id')}
                className="absolute top-2 right-2 text-blue-400 dark:text-orange-500 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="flex items-start gap-2 pr-6">
                <Eye className="w-3 h-3 text-blue-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-orange-300">
                  The <strong>agent_id</strong> will be provided after you create monitoring below.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Condensed Steps for Mobile */} 
            <div className="space-y-3">
              {/* Step 1 - Prerequisites */} 
              <div className={`border-l-2 border-neutral-200 dark:border-neutral-700 pl-3 ${isMobile ? '' : 'pl-4'}`}>
                <div className="absolute -ml-5 mt-0.5 w-2.5 h-2.5 bg-blue-500 dark:bg-orange-400 rounded-full"></div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">1. Prerequisites</h3>
                {isMobile ? (
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <p>• Python 3.8+ installed</p>
                    <p>• OpenAI/LLM API keys</p>
                    <p>• TTS service credentials</p>
                    <p className="text-red-600 dark:text-red-400 font-medium">• Your SoundFlare Project API key</p>
                  </div>
                ) : (
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-1.5">
                      <div className="w-1 h-1 bg-blue-500 dark:bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                      Python 3.8+ installed on your system
                    </li>
                    <li className="flex items-start gap-1.5">
                      <div className="w-1 h-1 bg-blue-500 dark:bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                      API keys for your chosen LLM provider (OpenAI, etc.)
                    </li>
                    <li className="flex items-start gap-1.5">
                      <div className="w-1 h-1 bg-blue-500 dark:bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                      Text-to-speech service credentials (ElevenLabs, etc.)
                    </li>
                    <li className="flex items-start gap-1.5">
                      <div className="w-1 h-1 bg-red-500 dark:bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-red-700 dark:text-red-400 font-medium">Your SoundFlare Project API key</span>
                    </li>
                  </ul>
                )}
              </div>

              {/* Step 2 - Install LiveKit */} 
              <div className={`border-l-2 border-neutral-200 dark:border-neutral-700 pl-3 ${isMobile ? '' : 'pl-4'} relative`}>
                <div className="absolute -ml-5 mt-0.5 w-2.5 h-2.5 bg-blue-500 dark:bg-orange-400 rounded-full"></div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">2. Install LiveKit</h3>
                <div className="relative">
                  <div className="bg-gray-900 dark:bg-neutral-950 rounded-lg p-2.5">
                    <pre className={`text-gray-100 font-mono ${isMobile ? 'text-xs' : 'text-sm'}`}>
{isMobile ? 
`pip install livekit-agents livekit-plugins-openai
livekit-plugins-elevenlabs livekit-plugins-silero` :
`pip install livekit-agents
pip install livekit-plugins-openai
pip install livekit-plugins-elevenlabs
pip install livekit-plugins-silero`}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`pip install livekit-agents livekit-plugins-openai livekit-plugins-elevenlabs livekit-plugins-silero`, 'install-livekit')}
                      className="absolute top-2 right-2 p-1 bg-gray-800 hover:bg-gray-700 rounded"
                    >
                      {copiedCode === 'install-livekit' ? (
                        <div className="w-3 h-3 text-green-400">✓</div>
                      ) : (
                        <Copy className="w-2.5 h-2.5 text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 3 - Install SoundFlare */} 
              <div className={`border-l-2 border-neutral-200 dark:border-neutral-700 pl-3 ${isMobile ? '' : 'pl-4'} relative`}>
                <div className="absolute -ml-5 mt-0.5 w-2.5 h-2.5 bg-blue-500 dark:bg-orange-400 rounded-full"></div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">3. Install SoundFlare</h3>
                <div className="relative">
                  <div className="bg-gray-900 dark:bg-neutral-950 rounded-lg p-2.5">
                    <pre className={`text-gray-100 font-mono ${isMobile ? 'text-xs' : 'text-sm'}`}>pip install soundflare</pre>
                    <button
                      onClick={() => copyToClipboard('pip install soundflare', 'install-soundflare')}
                      className="absolute top-2 right-2 p-1 bg-gray-800 hover:bg-gray-700 rounded"
                    >
                      {copiedCode === 'install-soundflare' ? (
                        <div className="w-3 h-3 text-green-400">✓</div>
                      ) : (
                        <Copy className="w-2.5 h-2.5 text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 4 - Code Example (Expandable on mobile) */} 
              <div className={`border-l-2 border-neutral-200 dark:border-neutral-700 pl-3 ${isMobile ? '' : 'pl-4'} relative`}>
                <div className="absolute -ml-5 mt-0.5 w-2.5 h-2.5 bg-blue-500 dark:bg-orange-400 rounded-full"></div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">4. Complete Example</h3>
                  {isMobile && (
                    <button
                      onClick={() => setExpandedExample(!expandedExample)}
                      className="flex items-center gap-1 text-xs text-blue-600 dark:text-orange-400"
                    >
                      {expandedExample ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {expandedExample ? 'Hide' : 'Show'} Code
                    </button>
                  )}
                </div>
                
                {(!isMobile || expandedExample) && (
                  <div className="relative">
                    <div className="bg-gray-900 dark:bg-neutral-950 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="flex gap-0.5">
                          <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                        </div>
                        <Terminal className="w-2.5 h-2.5 text-gray-400" />
                        <span className="text-xs text-gray-400">agent.py</span>
                      </div>
                      <pre className={`text-gray-100 font-mono overflow-x-auto ${isMobile ? 'text-xs max-h-48' : 'text-xs max-h-64'} overflow-y-auto`}>
                        {COMPLETE_AGENT_CODE}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(COMPLETE_AGENT_CODE, 'complete-example')}
                        className="absolute top-2 right-2 p-1 bg-gray-800 hover:bg-gray-700 rounded"
                      >
                        {copiedCode === 'complete-example' ? (
                          <div className="w-3 h-3 text-green-400">✓</div>
                        ) : (
                          <Copy className="w-2.5 h-2.5 text-gray-300" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">
                Ready to set up monitoring for your agent?
              </p>
              <Button 
                onClick={onCreateAgent}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white text-sm"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Configure Monitoring Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Experienced users - Mobile optimized
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
      <div className={isMobile ? 'p-4' : 'p-6'}>
        <div className={`flex items-center justify-between mb-4 ${isMobile ? 'flex-col gap-3' : ''}`}>
          <div className={isMobile ? 'text-center' : ''}>
            <h2 className={`font-semibold text-gray-900 dark:text-gray-100 mb-1 ${isMobile ? 'text-base' : 'text-lg'}`}>
              Quick Integration Guide
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Add SoundFlare monitoring to existing agents</p>
          </div>
          <div className={`flex items-center gap-2 ${isMobile ? 'flex-col w-full' : ''}`}>
            <a
              href="https://youtu.be/1POj8h99xnE"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 px-2 py-1.5 rounded-lg transition-all ${isMobile ? 'w-full justify-center' : ''}`}
            >
              <Play className="w-3 h-3" />
              Video tutorial
            </a>
            <Button 
              variant="outline" 
              onClick={() => setExperienceLevel('unknown')}
              size="sm"
              className={`text-gray-600 dark:text-gray-400 border-neutral-300 dark:border-neutral-600 text-xs ${isMobile ? 'w-full' : ''}`}
            >
              ← Back
            </Button>
          </div>
        </div>

        {/* Quick steps - Stack vertically on mobile */} 
        <div className={`${isMobile ? 'space-y-4' : 'grid md:grid-cols-3 gap-4'} mb-4`}>
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">1. Install SoundFlare</h3>
            <div className="relative">
              <div className="bg-gray-900 dark:bg-neutral-950 rounded-lg p-2">
                <pre className="text-gray-100 text-xs font-mono">pip install soundflare</pre>
                <button
                  onClick={() => copyToClipboard('pip install soundflare', 'quick-install')}
                  className="absolute top-1.5 right-1.5 p-0.5 bg-gray-800 hover:bg-gray-700 rounded"
                >
                  {copiedCode === 'quick-install' ? (
                    <div className="w-2.5 h-2.5 text-green-400">✓</div>
                  ) : (
                    <Copy className="w-2.5 h-2.5 text-gray-300" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">2. Import & Initialize</h3>
            <div className="relative">
              <div className="bg-gray-900 dark:bg-neutral-950 rounded-lg p-2">
                <pre className="text-gray-100 text-xs font-mono">
{`from soundflare import LivekitObserve

trillet_evals = LivekitObserve(
    agent_id="YOUR_AGENT_ID",
    apikey=os.getenv("TRILLET_EVALS_API_KEY")
)`}
                </pre>
                <button
                  onClick={() => copyToClipboard(`from soundflare import LivekitObserve\n\ntrillet_evals = LivekitObserve(\n    agent_id=\"YOUR_AGENT_ID\",\n    apikey=os.getenv(\"TRILLET_EVALS_API_KEY\")\n)`, 'quick-init')}
                  className="absolute top-1.5 right-1.5 p-0.5 bg-gray-800 hover:bg-gray-700 rounded"
                >
                  {copiedCode === 'quick-init' ? (
                    <div className="w-2.5 h-2.5 text-green-400">✓</div>
                  ) : (
                    <Copy className="w-2.5 h-2.5 text-gray-300" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">3. Add to Session</h3>
            <div className="relative">
              <div className="bg-gray-900 dark:bg-neutral-950 rounded-lg p-2">
                <pre className="text-gray-100 text-xs font-mono">
{`session_id = trillet_evals.start_session(session)

async def shutdown():
    await trillet_evals.export(session_id)
ctx.add_shutdown_callback(shutdown)`}
                </pre>
                <button
                  onClick={() => copyToClipboard(`session_id = trillet_evals.start_session(session)\n\nasync def shutdown():\n    await trillet_evals.export(session_id)\nctx.add_shutdown_callback(shutdown)`, 'quick-session')}
                  className="absolute top-1.5 right-1.5 p-0.5 bg-gray-800 hover:bg-gray-700 rounded"
                >
                  {copiedCode === 'quick-session' ? (
                    <div className="w-2.5 h-2.5 text-green-400">✓</div>
                  ) : (
                    <Copy className="w-2.5 h-2.5 text-gray-300" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">
            Ready to configure your monitoring dashboard?
          </p>
          <Button 
            onClick={onCreateAgent}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white text-sm"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            Configure Monitoring Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AdaptiveTutorialEmptyState
