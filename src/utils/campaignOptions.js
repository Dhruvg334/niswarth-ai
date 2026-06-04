export const CAMPAIGN_TYPE_OPTIONS = [
  { value: 'education', label: 'Education' },
  { value: 'health', label: 'Health' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'animal_welfare', label: 'Animal Welfare' },
  { value: 'environment', label: 'Environment' },
  { value: 'community_development', label: 'Community Development' },
  { value: 'livelihood', label: 'Livelihood' },
  { value: 'disaster_relief', label: 'Disaster Relief' },
  { value: 'women_child_welfare', label: 'Women & Child Welfare' },
  { value: 'awareness', label: 'Awareness Drive' },
  { value: 'fundraising', label: 'Fundraising' },
  { value: 'other', label: 'Other Campaign' },
]

export const CAMPAIGN_STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const CAMPAIGN_TYPE_LABELS = Object.fromEntries(
  CAMPAIGN_TYPE_OPTIONS.map((option) => [option.value, option.label])
)

export const CAMPAIGN_STATUS_LABELS = Object.fromEntries(
  CAMPAIGN_STATUS_OPTIONS.map((option) => [option.value, option.label])
)

export function getCampaignTypeLabel(type) {
  return CAMPAIGN_TYPE_LABELS[type] || type || 'Other Campaign'
}

export function getCampaignStatusLabel(status) {
  return CAMPAIGN_STATUS_LABELS[status] || status || 'Planning'
}
