import type { ToolCombo } from '@/types'

export const SEED_COMBOS: ToolCombo[] = [
  {
    id: 'combo-triage-agent',
    name: 'Triage Agent Stack',
    description:
      'The most complete triage solution. Copilot Studio handles conversations, SharePoint stores KB articles, Power Automate routes escalations.',
    primaryToolId: 'tool-copilot-studio',
    addOnToolIds: ['tool-sharepoint', 'tool-power-automate'],
    addOnRoles: {
      'tool-sharepoint': 'Knowledge store',
      'tool-power-automate': 'Routing & alerts',
    },
    matchScore: 94,
    bestForKeywords: ['triage', 'ticket', 'agent', 'Q&A', 'help desk', 'chatbot'],
    skillLevelRequired: 'Intermediate',
    riskFlags: [],
  },
  {
    id: 'combo-lightweight-automation',
    name: 'Lightweight Automation',
    description:
      'Good for rule-based ticket routing and dashboarding. Simpler to deploy but less conversational.',
    primaryToolId: 'tool-power-automate',
    addOnToolIds: ['tool-power-bi'],
    addOnRoles: {
      'tool-power-bi': 'Triage metrics',
    },
    matchScore: 71,
    bestForKeywords: ['automate', 'workflow', 'routing', 'approval'],
    skillLevelRequired: 'Basic',
    riskFlags: [],
  },
  {
    id: 'combo-ai-search',
    name: 'AI-Powered Search',
    description:
      'Best for high-volume semantic search over large corpora. Pairs Azure AI Search retrieval with an LLM layer for grounded answers.',
    primaryToolId: 'tool-azure-ai-search',
    addOnToolIds: ['tool-azure-ai-foundry', 'tool-sharepoint'],
    addOnRoles: {
      'tool-azure-ai-foundry': 'LLM layer',
      'tool-sharepoint': 'Data source',
    },
    matchScore: 68,
    bestForKeywords: ['search', 'knowledge base', 'retrieval', 'documents', 'semantic'],
    skillLevelRequired: 'Advanced',
    riskFlags: ['Requires Advanced skill level'],
  },
  {
    id: 'combo-predictive-insights',
    name: 'Predictive Insights',
    description:
      'For forecasting failures, anomaly detection, and demand prediction. Pairs a trained ML model with Power BI visualisation.',
    primaryToolId: 'tool-azure-ml',
    addOnToolIds: ['tool-power-bi'],
    addOnRoles: {
      'tool-power-bi': 'Visualisation',
    },
    matchScore: 65,
    bestForKeywords: ['predict', 'forecast', 'anomaly', 'model', 'demand'],
    skillLevelRequired: 'Advanced',
    riskFlags: ['Requires Advanced skill level', 'Data sensitivity may exceed limits'],
  },
  {
    id: 'combo-document-qa',
    name: 'Document Q&A',
    description:
      'Quick wins on summarising and querying internal documents. Best inside Microsoft 365 environments.',
    primaryToolId: 'tool-m365-copilot',
    addOnToolIds: ['tool-sharepoint'],
    addOnRoles: {
      'tool-sharepoint': 'Document corpus',
    },
    matchScore: 58,
    bestForKeywords: ['document', 'Q&A', 'summarise', 'office', 'report'],
    skillLevelRequired: 'Basic',
    riskFlags: [],
  },
]
