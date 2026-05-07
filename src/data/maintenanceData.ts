// ── Types ────────────────────────────────────────────────────────────
export interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  mileage: number | null
  fuel_type?: string
  is_default?: boolean
}

export interface MaintenancePrefs {
  avgMilesPerMonth: number
  drivingStyle: 'city' | 'highway' | 'mixed'
  usageLevel: 'light' | 'normal' | 'heavy'
  region: 'hot' | 'cold' | 'temperate'
  lastOilChangeMileage?: number
  lastOilChangeDate?: string
  lastTireRotationMileage?: number
  lastTireRotationDate?: string
  lastBrakeInspectionMileage?: number
  lastBrakeInspectionDate?: string
  lastAirFilterMileage?: number
  lastAirFilterDate?: string
  lastBatteryCheckDate?: string
  lastCoolantCheckDate?: string
}

export type ServiceStatus = 'good' | 'coming_soon' | 'due' | 'overdue'

export interface MaintenanceItem {
  id: string
  label: string
  icon: string // lucide icon name
  intervalMiles: number
  intervalMonths: number
  costLow: number
  costHigh: number
  riskIfDelayed: string
  antiScamNote: string
  lastServiceMileage: number
  lastServiceDate: string
}

export interface MaintenanceStatus {
  item: MaintenanceItem
  status: ServiceStatus
  milesSince: number
  monthsSince: number
  nextDueMileage: number
  nextDueDate: Date
  milesUntilDue: number
  daysUntilDue: number
  titleKey: string
  explanationKey: string
  explanationParams: {
    miles?: string
    months?: number
    days?: number
  }
}

export interface ServiceRecord {
  id: string
  vehicleId: string
  serviceType: string
  date: string
  mileage: number
  cost: number
  shopName: string
  notes: string
  partsReplaced: string
  warrantyNotes: string
  receiptUrl?: string
}

export interface HealthCategory {
  label: string
  score: number
  maxScore: number
  status: 'excellent' | 'good' | 'attention' | 'risk'
}

export interface RepairReason {
  key: string
  params?: Record<string, string | number>
}

export interface RepairDecision {
  verdict: 'worth_fixing' | 'second_opinion' | 'not_worth' | 'consider_selling'
  titleKey: string
  color: string
  reasons: RepairReason[]
  savings?: string
}

// ── Default Service Schedule ─────────────────────────────────────────
export const DEFAULT_SCHEDULE: Omit<MaintenanceItem, 'lastServiceMileage' | 'lastServiceDate'>[] = [
  {
    id: 'oil_change',
    label: 'maintenance.service_types.oil_change',
    icon: 'Droplets',
    intervalMiles: 5000,
    intervalMonths: 6,
    costLow: 40,
    costHigh: 120,
    riskIfDelayed: 'maintenance.risk_delayed.oil_change',
    antiScamNote: 'maintenance.anti_scam.oil_change',
  },
  {
    id: 'tire_rotation',
    label: 'maintenance.service_types.tire_rotation',
    icon: 'CircleDot',
    intervalMiles: 7500,
    intervalMonths: 6,
    costLow: 20,
    costHigh: 50,
    riskIfDelayed: 'maintenance.risk_delayed.tire_rotation',
    antiScamNote: 'maintenance.anti_scam.tire_rotation',
  },
  {
    id: 'brake_inspection',
    label: 'maintenance.service_types.brake_inspection',
    icon: 'ShieldAlert',
    intervalMiles: 20000,
    intervalMonths: 12,
    costLow: 0,
    costHigh: 50,
    riskIfDelayed: 'maintenance.risk_delayed.brake_inspection',
    antiScamNote: 'maintenance.anti_scam.brake_inspection',
  },
  {
    id: 'air_filter',
    label: 'maintenance.service_types.air_filter',
    icon: 'Wind',
    intervalMiles: 30000,
    intervalMonths: 24,
    costLow: 15,
    costHigh: 60,
    riskIfDelayed: 'maintenance.risk_delayed.air_filter',
    antiScamNote: 'maintenance.anti_scam.air_filter',
  },
  {
    id: 'battery_check',
    label: 'maintenance.service_types.battery_check',
    icon: 'BatteryMedium',
    intervalMiles: 0,
    intervalMonths: 12,
    costLow: 0,
    costHigh: 30,
    riskIfDelayed: 'maintenance.risk_delayed.battery_check',
    antiScamNote: 'maintenance.anti_scam.battery_check',
  },
  {
    id: 'coolant_check',
    label: 'maintenance.service_types.coolant_check',
    icon: 'Thermometer',
    intervalMiles: 30000,
    intervalMonths: 24,
    costLow: 20,
    costHigh: 80,
    riskIfDelayed: 'maintenance.risk_delayed.coolant_check',
    antiScamNote: 'maintenance.anti_scam.coolant_check',
  },
]

// ── Calculate Status ─────────────────────────────────────────────────
export function calculateMaintenanceStatus(
  item: MaintenanceItem,
  currentMileage: number,
  prefs: MaintenancePrefs
): MaintenanceStatus {
  const now = new Date()
  const lastDate = new Date(item.lastServiceDate)
  const monthsSince = (now.getFullYear() - lastDate.getFullYear()) * 12 + (now.getMonth() - lastDate.getMonth())
  const milesSince = Math.max(0, currentMileage - item.lastServiceMileage)

  let modifier = 1.0
  if (prefs.usageLevel === 'heavy') modifier *= 0.8
  if (prefs.drivingStyle === 'city') modifier *= 0.9
  if (prefs.region === 'hot') modifier *= 0.9

  const adjIntervalMiles = Math.round(item.intervalMiles * modifier)
  const nextDueMileage = item.lastServiceMileage + adjIntervalMiles
  const nextDueDate = new Date(lastDate)
  nextDueDate.setMonth(nextDueDate.getMonth() + item.intervalMonths)

  const milesUntilDue = nextDueMileage - currentMileage
  const daysUntilDue = Math.round((nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  let status: ServiceStatus = 'good'
  let titleKey = 'maintenance.status_labels.all_good'
  let explanationKey = item.intervalMiles > 0 ? 'maintenance.status_explanations.good_miles' : 'maintenance.status_explanations.good_date'
  let explanationParams: { miles?: string; months?: number; days?: number } = { 
    miles: Math.max(0, milesUntilDue).toLocaleString(), 
    months: Math.max(0, Math.round(daysUntilDue / 30)) 
  }

  if (milesUntilDue <= 0 || daysUntilDue <= 0) {
    status = 'overdue'
    titleKey = 'maintenance.status_labels.overdue'
    if (milesUntilDue <= 0) {
      explanationKey = 'maintenance.status_explanations.overdue_miles'
      explanationParams = { miles: Math.abs(milesUntilDue).toLocaleString() }
    } else {
      explanationKey = 'maintenance.status_explanations.overdue_days'
      explanationParams = { days: Math.abs(daysUntilDue) }
    }
  } else if (milesUntilDue <= 500 || daysUntilDue <= 14) {
    status = 'due'
    titleKey = 'maintenance.status_labels.due_now'
    if (item.intervalMiles > 0) {
      explanationKey = 'maintenance.status_explanations.due_now_miles'
      explanationParams = { miles: Math.max(0, milesUntilDue).toLocaleString(), days: daysUntilDue }
    } else {
      explanationKey = 'maintenance.status_explanations.due_now_days'
      explanationParams = { days: daysUntilDue }
    }
  } else if (milesUntilDue <= 1500 || daysUntilDue <= 60) {
    status = 'coming_soon'
    titleKey = 'maintenance.status_labels.coming_soon'
    if (item.intervalMiles > 0) {
      explanationKey = 'maintenance.status_explanations.coming_soon_miles'
      explanationParams = { miles: milesUntilDue.toLocaleString(), months: Math.round(daysUntilDue / 30) }
    } else {
      explanationKey = 'maintenance.status_explanations.coming_soon_date'
      explanationParams = { months: Math.round(daysUntilDue / 30) }
    }
  }

  return {
    item, status, milesSince, monthsSince,
    nextDueMileage, nextDueDate,
    milesUntilDue, daysUntilDue,
    titleKey, explanationKey, explanationParams,
  }
}

// ── Health Score Calculator ──────────────────────────────────────────
export function calculateHealthScore(
  statuses: MaintenanceStatus[],
  serviceHistory: ServiceRecord[]
): { total: number; labelKey: string; categories: HealthCategory[] } {
  const cats: HealthCategory[] = [
    { label: 'Engine', score: 20, maxScore: 20, status: 'excellent' },
    { label: 'Brakes', score: 20, maxScore: 20, status: 'excellent' },
    { label: 'Tires', score: 15, maxScore: 15, status: 'excellent' },
    { label: 'Fluids', score: 15, maxScore: 15, status: 'excellent' },
    { label: 'Battery / Electrical', score: 15, maxScore: 15, status: 'excellent' },
    { label: 'Maintenance Consistency', score: 15, maxScore: 15, status: 'excellent' },
  ]

  const penalty = (catIdx: number, amount: number) => {
    cats[catIdx].score = Math.max(0, cats[catIdx].score - amount)
  }

  statuses.forEach(s => {
    const deduct = s.status === 'overdue' ? 15 : s.status === 'due' ? 8 : s.status === 'coming_soon' ? 2 : 0
    if (s.item.id === 'oil_change') penalty(0, deduct)
    if (s.item.id === 'brake_inspection') penalty(1, deduct)
    if (s.item.id === 'tire_rotation') penalty(2, deduct)
    if (s.item.id === 'coolant_check') penalty(3, deduct)
    if (s.item.id === 'battery_check') penalty(4, deduct)
    if (s.item.id === 'air_filter') penalty(0, Math.round(deduct * 0.5))
  })

  // Consistency bonus/penalty
  if (serviceHistory.length === 0) penalty(5, 10)
  else if (serviceHistory.length < 3) penalty(5, 5)

  cats.forEach(c => {
    const pct = c.score / c.maxScore
    c.status = pct >= 0.85 ? 'excellent' : pct >= 0.6 ? 'good' : pct >= 0.35 ? 'attention' : 'risk'
  })

  const total = cats.reduce((a, c) => a + c.score, 0)
  const labelKey = total >= 85 ? 'maintenance.status_labels.excellent' : total >= 65 ? 'maintenance.status_labels.good' : total >= 40 ? 'maintenance.status_labels.attention' : 'maintenance.status_labels.high_risk'

  return { total, labelKey, categories: cats }
}

// ── Fluid Guide Data ────────────────────────────────────────────────
export interface FluidInfo {
  id: string
  nameKey: string
  locationKey: string
  howToCheckKey: string
  warningSignsKey: string
  doNotKey: string
  seeAMechanicKey: string
  color: string
  icon: string
}

export const FLUID_GUIDE: FluidInfo[] = [
  {
    id: 'oil',
    nameKey: 'maintenance.fluid_guide_tool.fluids.engine_oil.name',
    locationKey: 'maintenance.fluid_guide_tool.fluids.engine_oil.location',
    howToCheckKey: 'maintenance.fluid_guide_tool.fluids.engine_oil.how_to_check',
    warningSignsKey: 'maintenance.fluid_guide_tool.fluids.engine_oil.warning_signs',
    doNotKey: 'maintenance.fluid_guide_tool.fluids.engine_oil.do_not',
    seeAMechanicKey: 'maintenance.fluid_guide_tool.fluids.engine_oil.see_mechanic',
    color: '#eab308',
    icon: 'Droplet'
  },
  {
    id: 'coolant',
    nameKey: 'maintenance.fluid_guide_tool.fluids.coolant.name',
    locationKey: 'maintenance.fluid_guide_tool.fluids.coolant.location',
    howToCheckKey: 'maintenance.fluid_guide_tool.fluids.coolant.how_to_check',
    warningSignsKey: 'maintenance.fluid_guide_tool.fluids.coolant.warning_signs',
    doNotKey: 'maintenance.fluid_guide_tool.fluids.coolant.do_not',
    seeAMechanicKey: 'maintenance.fluid_guide_tool.fluids.coolant.see_mechanic',
    color: '#22c55e',
    icon: 'Thermometer'
  },
  {
    id: 'brake',
    nameKey: 'maintenance.fluid_guide_tool.fluids.brake_fluid.name',
    locationKey: 'maintenance.fluid_guide_tool.fluids.brake_fluid.location',
    howToCheckKey: 'maintenance.fluid_guide_tool.fluids.brake_fluid.how_to_check',
    warningSignsKey: 'maintenance.fluid_guide_tool.fluids.brake_fluid.warning_signs',
    doNotKey: 'maintenance.fluid_guide_tool.fluids.brake_fluid.do_not',
    seeAMechanicKey: 'maintenance.fluid_guide_tool.fluids.brake_fluid.see_mechanic',
    color: '#f97316',
    icon: 'ShieldAlert'
  },
  {
    id: 'steering',
    nameKey: 'maintenance.fluid_guide_tool.fluids.power_steering.name',
    locationKey: 'maintenance.fluid_guide_tool.fluids.power_steering.location',
    howToCheckKey: 'maintenance.fluid_guide_tool.fluids.power_steering.how_to_check',
    warningSignsKey: 'maintenance.fluid_guide_tool.fluids.power_steering.warning_signs',
    doNotKey: 'maintenance.fluid_guide_tool.fluids.power_steering.do_not',
    seeAMechanicKey: 'maintenance.fluid_guide_tool.fluids.power_steering.see_mechanic',
    color: '#ef4444',
    icon: 'RotateCw'
  },
  {
    id: 'washer',
    nameKey: 'maintenance.fluid_guide_tool.fluids.washer_fluid.name',
    locationKey: 'maintenance.fluid_guide_tool.fluids.washer_fluid.location',
    howToCheckKey: 'maintenance.fluid_guide_tool.fluids.washer_fluid.how_to_check',
    warningSignsKey: 'maintenance.fluid_guide_tool.fluids.washer_fluid.warning_signs',
    doNotKey: 'maintenance.fluid_guide_tool.fluids.washer_fluid.do_not',
    seeAMechanicKey: 'maintenance.fluid_guide_tool.fluids.washer_fluid.see_mechanic',
    color: '#3b82f6',
    icon: 'Droplets'
  },
  {
    id: 'transmission',
    nameKey: 'maintenance.fluid_guide_tool.fluids.transmission.name',
    locationKey: 'maintenance.fluid_guide_tool.fluids.transmission.location',
    howToCheckKey: 'maintenance.fluid_guide_tool.fluids.transmission.how_to_check',
    warningSignsKey: 'maintenance.fluid_guide_tool.fluids.transmission.warning_signs',
    doNotKey: 'maintenance.fluid_guide_tool.fluids.transmission.do_not',
    seeAMechanicKey: 'maintenance.fluid_guide_tool.fluids.transmission.see_mechanic',
    color: '#8b5cf6',
    icon: 'Cog'
  }
]

// ── Seasonal Checklists ──────────────────────────────────────────────
export interface ChecklistItem {
  id: string
  labelKey: string
  descriptionKey: string
  warningLevel: 'info' | 'warning' | 'critical'
  checked: boolean
}

export interface SeasonalChecklistData {
  id: string
  titleKey: string
  icon: string
  color: string
  items: ChecklistItem[]
}

export function getSeasonalChecklists(_region: 'hot' | 'cold' | 'temperate'): SeasonalChecklistData[] {
  const summer: SeasonalChecklistData = {
    id: 'summer',
    titleKey: 'maintenance.seasonal_tool.checklists.summer.title',
    icon: 'Sun',
    color: '#f59e0b',
    items: [
      { id: 's1', labelKey: 'maintenance.seasonal_tool.checklists.summer.items.s1.label', descriptionKey: 'maintenance.seasonal_tool.checklists.summer.items.s1.description', warningLevel: 'critical', checked: false },
      { id: 's2', labelKey: 'maintenance.seasonal_tool.checklists.summer.items.s2.label', descriptionKey: 'maintenance.seasonal_tool.checklists.summer.items.s2.description', warningLevel: 'warning', checked: false },
      { id: 's3', labelKey: 'maintenance.seasonal_tool.checklists.summer.items.s3.label', descriptionKey: 'maintenance.seasonal_tool.checklists.summer.items.s3.description', warningLevel: 'critical', checked: false },
      { id: 's4', labelKey: 'maintenance.seasonal_tool.checklists.summer.items.s4.label', descriptionKey: 'maintenance.seasonal_tool.checklists.summer.items.s4.description', warningLevel: 'warning', checked: false },
      { id: 's5', labelKey: 'maintenance.seasonal_tool.checklists.summer.items.s5.label', descriptionKey: 'maintenance.seasonal_tool.checklists.summer.items.s5.description', warningLevel: 'info', checked: false },
      { id: 's6', labelKey: 'maintenance.seasonal_tool.checklists.summer.items.s6.label', descriptionKey: 'maintenance.seasonal_tool.checklists.summer.items.s6.description', warningLevel: 'critical', checked: false },
      { id: 's7', labelKey: 'maintenance.seasonal_tool.checklists.summer.items.s7.label', descriptionKey: 'maintenance.seasonal_tool.checklists.summer.items.s7.description', warningLevel: 'warning', checked: false },
      { id: 's8', labelKey: 'maintenance.seasonal_tool.checklists.summer.items.s8.label', descriptionKey: 'maintenance.seasonal_tool.checklists.summer.items.s8.description', warningLevel: 'info', checked: false },
    ],
  }

  const winter: SeasonalChecklistData = {
    id: 'winter',
    titleKey: 'maintenance.seasonal_tool.checklists.winter.title',
    icon: 'Snowflake',
    color: '#3b82f6',
    items: [
      { id: 'w1', labelKey: 'maintenance.seasonal_tool.checklists.winter.items.w1.label', descriptionKey: 'maintenance.seasonal_tool.checklists.winter.items.w1.description', warningLevel: 'critical', checked: false },
      { id: 'w2', labelKey: 'maintenance.seasonal_tool.checklists.winter.items.w2.label', descriptionKey: 'maintenance.seasonal_tool.checklists.winter.items.w2.description', warningLevel: 'critical', checked: false },
      { id: 'w3', labelKey: 'maintenance.seasonal_tool.checklists.winter.items.w3.label', descriptionKey: 'maintenance.seasonal_tool.checklists.winter.items.w3.description', warningLevel: 'critical', checked: false },
      { id: 'w4', labelKey: 'maintenance.seasonal_tool.checklists.winter.items.w4.label', descriptionKey: 'maintenance.seasonal_tool.checklists.winter.items.w4.description', warningLevel: 'warning', checked: false },
      { id: 'w5', labelKey: 'maintenance.seasonal_tool.checklists.winter.items.w5.label', descriptionKey: 'maintenance.seasonal_tool.checklists.winter.items.w5.description', warningLevel: 'warning', checked: false },
      { id: 'w6', labelKey: 'maintenance.seasonal_tool.checklists.winter.items.w6.label', descriptionKey: 'maintenance.seasonal_tool.checklists.winter.items.w6.description', warningLevel: 'info', checked: false },
      { id: 'w7', labelKey: 'maintenance.seasonal_tool.checklists.winter.items.w7.label', descriptionKey: 'maintenance.seasonal_tool.checklists.winter.items.w7.description', warningLevel: 'info', checked: false },
    ],
  }

  const roadTrip: SeasonalChecklistData = {
    id: 'roadtrip',
    titleKey: 'maintenance.seasonal_tool.checklists.roadtrip.title',
    icon: 'MapPin',
    color: '#10b981',
    items: [
      { id: 'r1', labelKey: 'maintenance.seasonal_tool.checklists.roadtrip.items.r1.label', descriptionKey: 'maintenance.seasonal_tool.checklists.roadtrip.items.r1.description', warningLevel: 'warning', checked: false },
      { id: 'r2', labelKey: 'maintenance.seasonal_tool.checklists.roadtrip.items.r2.label', descriptionKey: 'maintenance.seasonal_tool.checklists.roadtrip.items.r2.description', warningLevel: 'critical', checked: false },
      { id: 'r3', labelKey: 'maintenance.seasonal_tool.checklists.roadtrip.items.r3.label', descriptionKey: 'maintenance.seasonal_tool.checklists.roadtrip.items.r3.description', warningLevel: 'critical', checked: false },
      { id: 'r4', labelKey: 'maintenance.seasonal_tool.checklists.roadtrip.items.r4.label', descriptionKey: 'maintenance.seasonal_tool.checklists.roadtrip.items.r4.description', warningLevel: 'warning', checked: false },
      { id: 'r5', labelKey: 'maintenance.seasonal_tool.checklists.roadtrip.items.r5.label', descriptionKey: 'maintenance.seasonal_tool.checklists.roadtrip.items.r5.description', warningLevel: 'warning', checked: false },
      { id: 'r6', labelKey: 'maintenance.seasonal_tool.checklists.roadtrip.items.r6.label', descriptionKey: 'maintenance.seasonal_tool.checklists.roadtrip.items.r6.description', warningLevel: 'info', checked: false },
      { id: 'r7', labelKey: 'maintenance.seasonal_tool.checklists.roadtrip.items.r7.label', descriptionKey: 'maintenance.seasonal_tool.checklists.roadtrip.items.r7.description', warningLevel: 'info', checked: false },
    ],
  }

  return [summer, winter, roadTrip]
}

// ── Repair Worth-Fixing Logic ────────────────────────────────────────
export function evaluateRepair(input: {
  carValue: number
  repairCost: number
  mileage: number
  carYear: number
  repairType: string
  condition: string
  yearsToKeep: number
}): RepairDecision {
  const { carValue, repairCost, mileage, carYear, repairType, condition, yearsToKeep } = input
  const ratio = Math.round((repairCost / carValue) * 100)
  const carAge = new Date().getFullYear() - carYear
  const isSafety = /brake|steering|tire|airbag|suspension|light/i.test(repairType)
  const isHighMileage = mileage > 150000
  const reasons: RepairReason[] = []

  if (isSafety) {
    reasons.push({ key: 'maintenance.advisor_tool.reasons.safety' })
  }

  if (ratio > 75) {
    reasons.push({ key: 'maintenance.advisor_tool.reasons.ratio_high', params: { ratio } })
  } else if (ratio > 50) {
    reasons.push({ key: 'maintenance.advisor_tool.reasons.ratio_sig', params: { ratio } })
  } else {
    reasons.push({ key: 'maintenance.advisor_tool.reasons.ratio_ok', params: { ratio } })
  }

  if (isHighMileage) {
    reasons.push({ key: 'maintenance.advisor_tool.reasons.high_mileage', params: { mileage: mileage.toLocaleString() } })
  }

  if (carAge > 12) {
    reasons.push({ key: 'maintenance.advisor_tool.reasons.old_car', params: { age: carAge } })
  }

  if (yearsToKeep <= 1) {
    reasons.push({ key: 'maintenance.advisor_tool.reasons.keep_short', params: { years: yearsToKeep } })
  } else if (yearsToKeep >= 3) {
    reasons.push({ key: 'maintenance.advisor_tool.reasons.keep_long', params: { years: yearsToKeep } })
  }

  if (condition === 'poor') {
    reasons.push({ key: 'maintenance.advisor_tool.reasons.poor_condition' })
  }

  let verdict: RepairDecision['verdict']
  let color: string
  let titleKey: string

  if (isSafety && ratio < 60) {
    verdict = 'worth_fixing'
    titleKey = 'maintenance.advisor_tool.verdicts.worth_fixing'
    color = '#10b981'
  } else if (ratio > 75 && !isSafety) {
    verdict = isHighMileage || carAge > 15 ? 'consider_selling' : 'not_worth'
    titleKey = `maintenance.advisor_tool.verdicts.${verdict}`
    color = verdict === 'consider_selling' ? '#f59e0b' : '#ef4444'
  } else if (ratio > 50 || (isHighMileage && carAge > 10)) {
    verdict = 'second_opinion'
    titleKey = 'maintenance.advisor_tool.verdicts.second_opinion'
    color = '#f59e0b'
  } else {
    verdict = 'worth_fixing'
    titleKey = 'maintenance.advisor_tool.verdicts.worth_fixing'
    color = '#10b981'
  }

  return { verdict, titleKey, color, reasons }
}

