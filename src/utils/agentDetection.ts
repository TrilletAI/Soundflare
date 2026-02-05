export const getAgentPlatform = (agent: any): 'livekit' | 'unknown' => {
    console.log({agent})
    if (agent?.agent_type === 'livekit' || agent?.agent_type === 'soundflare_agent') {
      return 'livekit'
    }
    return 'unknown'
}
