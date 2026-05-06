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
  title: string
  explanation: string
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

export interface RepairDecision {
  verdict: 'worth_fixing' | 'second_opinion' | 'not_worth' | 'consider_selling'
  title: string
  color: string
  reasons: string[]
  savings?: string
}

// ── Default Service Schedule ─────────────────────────────────────────
export const DEFAULT_SCHEDULE: Omit<MaintenanceItem, 'lastServiceMileage' | 'lastServiceDate'>[] = [
  {
    id: 'oil_change',
    label: 'Oil Change',
    icon: 'Droplets',
    intervalMiles: 5000,
    intervalMonths: 6,
    costLow: 40,
    costHigh: 120,
    riskIfDelayed: 'Engine wear, sludge buildup, decreased fuel efficiency, potential engine failure.',
    antiScamNote: 'Engine flush add-on is rarely needed. Synthetic oil lasts longer — ask if it\'s included in the quoted price.',
  },
  {
    id: 'tire_rotation',
    label: 'Tire Rotation',
    icon: 'CircleDot',
    intervalMiles: 7500,
    intervalMonths: 6,
    costLow: 20,
    costHigh: 50,
    riskIfDelayed: 'Uneven tire wear, reduced traction, shorter tire lifespan, alignment issues.',
    antiScamNote: 'Many tire shops offer free rotations if you purchased tires there. Always ask.',
  },
  {
    id: 'brake_inspection',
    label: 'Brake Inspection',
    icon: 'ShieldAlert',
    intervalMiles: 20000,
    intervalMonths: 12,
    costLow: 0,
    costHigh: 50,
    riskIfDelayed: 'Reduced stopping power, rotor damage (expensive to fix), safety hazard.',
    antiScamNote: 'Rotors often only need resurfacing, not full replacement. Get a second opinion before approving rotor work.',
  },
  {
    id: 'air_filter',
    label: 'Air Filter Replacement',
    icon: 'Wind',
    intervalMiles: 30000,
    intervalMonths: 24,
    costLow: 15,
    costHigh: 60,
    riskIfDelayed: 'Reduced fuel economy, sluggish acceleration, increased emissions.',
    antiScamNote: 'You can replace this yourself in 5 minutes with a $15 part from any auto store.',
  },
  {
    id: 'battery_check',
    label: 'Battery Check',
    icon: 'BatteryMedium',
    intervalMiles: 0,
    intervalMonths: 12,
    costLow: 0,
    costHigh: 30,
    riskIfDelayed: 'Unexpected no-start, electrical issues, stranded on the road.',
    antiScamNote: 'Most auto parts stores test batteries for free. Don\'t pay for a test.',
  },
  {
    id: 'coolant_check',
    label: 'Coolant System Check',
    icon: 'Thermometer',
    intervalMiles: 30000,
    intervalMonths: 24,
    costLow: 20,
    costHigh: 80,
    riskIfDelayed: 'Overheating, engine damage, head gasket failure (very expensive).',
    antiScamNote: 'Coolant flush is only needed every 30k-50k miles. Don\'t let shops push it at every oil change.',
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
  let title = `${item.label} — All Good`
  let explanation = `Next service in ~${Math.max(0, milesUntilDue).toLocaleString()} miles or ${Math.max(0, Math.round(daysUntilDue / 30))} months.`

  if (milesUntilDue <= 0 || daysUntilDue <= 0) {
    status = 'overdue'
    title = `${item.label} Overdue`
    explanation = milesUntilDue <= 0
      ? `Overdue by ${Math.abs(milesUntilDue).toLocaleString()} miles. Schedule this soon.`
      : `Overdue by ${Math.abs(daysUntilDue)} days. Schedule this soon.`
  } else if (milesUntilDue <= 500 || daysUntilDue <= 14) {
    status = 'due'
    title = `${item.label} Due Now`
    explanation = `Due within ${Math.max(0, milesUntilDue).toLocaleString()} miles or ${daysUntilDue} days.`
  } else if (milesUntilDue <= 1500 || daysUntilDue <= 60) {
    status = 'coming_soon'
    title = `${item.label} Coming Soon`
    explanation = `Coming up in ~${milesUntilDue.toLocaleString()} miles or ${Math.round(daysUntilDue / 30)} months.`
  }

  return {
    item, status, milesSince, monthsSince,
    nextDueMileage, nextDueDate,
    milesUntilDue, daysUntilDue,
    title, explanation,
  }
}

// ── Health Score Calculator ──────────────────────────────────────────
export function calculateHealthScore(
  statuses: MaintenanceStatus[],
  serviceHistory: ServiceRecord[]
): { total: number; label: string; categories: HealthCategory[] } {
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
  const label = total >= 85 ? 'Excellent' : total >= 65 ? 'Good' : total >= 40 ? 'Needs Attention' : 'High Risk'

  return { total, label, categories: cats }
}

// ── Seasonal Checklists ──────────────────────────────────────────────
export interface ChecklistItem {
  id: string
  label: string
  description: string
  warningLevel: 'info' | 'warning' | 'critical'
  checked: boolean
}

export interface SeasonalChecklistData {
  id: string
  title: string
  icon: string
  color: string
  items: ChecklistItem[]
}

export function getSeasonalChecklists(region: 'hot' | 'cold' | 'temperate'): SeasonalChecklistData[] {
  const summer: SeasonalChecklistData = {
    id: 'summer',
    title: 'Summer Readiness Check',
    icon: 'Sun',
    color: '#f59e0b',
    items: region === 'hot' ? [
      { id: 's1', label: 'Coolant Level', description: 'Critical in hot climates. Low coolant = overheating risk.', warningLevel: 'critical', checked: false },
      { id: 's2', label: 'AC Performance', description: 'Test before peak heat. Recharge if blowing warm air.', warningLevel: 'warning', checked: false },
      { id: 's3', label: 'Battery Health', description: 'Heat kills batteries faster than cold. Test voltage.', warningLevel: 'critical', checked: false },
      { id: 's4', label: 'Tire Pressure', description: 'Heat expands air. Check when tires are cold.', warningLevel: 'warning', checked: false },
      { id: 's5', label: 'Wiper Condition', description: 'Sun damage cracks wiper blades. Replace if streaking.', warningLevel: 'info', checked: false },
      { id: 's6', label: 'Engine Temperature', description: 'Monitor gauge. If needle rises, pull over immediately.', warningLevel: 'critical', checked: false },
      { id: 's7', label: 'Brake Fluid', description: 'Heat can degrade brake fluid. Check color and level.', warningLevel: 'warning', checked: false },
      { id: 's8', label: 'Emergency Kit', description: 'Water, sunshade, jumper cables, first aid kit.', warningLevel: 'info', checked: false },
    ] : [
      { id: 's1', label: 'AC System Check', description: 'Ensure proper cooling before summer heat arrives.', warningLevel: 'warning', checked: false },
      { id: 's2', label: 'Coolant Level', description: 'Top up coolant. Flush if over 2 years old.', warningLevel: 'warning', checked: false },
      { id: 's3', label: 'Tire Pressure', description: 'Warmer temps increase pressure. Adjust to spec.', warningLevel: 'info', checked: false },
      { id: 's4', label: 'Battery Test', description: 'Summer heat is hard on batteries. Test charge level.', warningLevel: 'warning', checked: false },
      { id: 's5', label: 'Wiper Blades', description: 'Replace if worn. Summer storms need clear visibility.', warningLevel: 'info', checked: false },
      { id: 's6', label: 'Emergency Kit', description: 'Water, sunscreen, flashlight, jumper cables.', warningLevel: 'info', checked: false },
    ],
  }

  const winter: SeasonalChecklistData = {
    id: 'winter',
    title: 'Winter Readiness Check',
    icon: 'Snowflake',
    color: '#3b82f6',
    items: region === 'cold' ? [
      { id: 'w1', label: 'Antifreeze Level', description: 'Must be at proper concentration to prevent freezing.', warningLevel: 'critical', checked: false },
      { id: 'w2', label: 'Battery Health', description: 'Cold cranking amps drop in winter. Test before freeze.', warningLevel: 'critical', checked: false },
      { id: 'w3', label: 'Tire Tread Depth', description: 'Consider winter tires. Min 4/32" tread for snow.', warningLevel: 'critical', checked: false },
      { id: 'w4', label: 'Wiper Blades', description: 'Install winter-grade wipers. Stock washer fluid.', warningLevel: 'warning', checked: false },
      { id: 'w5', label: 'Heater & Defroster', description: 'Test both. A broken heater is a safety issue.', warningLevel: 'warning', checked: false },
      { id: 'w6', label: 'Oil Viscosity', description: 'Switch to winter-weight oil if recommended.', warningLevel: 'info', checked: false },
      { id: 'w7', label: 'Winter Emergency Kit', description: 'Blanket, shovel, sand/salt, flashlight, snacks.', warningLevel: 'info', checked: false },
    ] : [
      { id: 'w1', label: 'Coolant Check', description: 'Ensure antifreeze mix is adequate for mild cold.', warningLevel: 'warning', checked: false },
      { id: 'w2', label: 'Battery Test', description: 'Cold mornings can strain older batteries.', warningLevel: 'warning', checked: false },
      { id: 'w3', label: 'Tire Condition', description: 'Check tread depth and pressure in cooler temps.', warningLevel: 'info', checked: false },
      { id: 'w4', label: 'Wiper Blades', description: 'Replace if streaking. Rain season needs clear visibility.', warningLevel: 'info', checked: false },
      { id: 'w5', label: 'Lights Check', description: 'Shorter days mean more night driving. Test all lights.', warningLevel: 'info', checked: false },
    ],
  }

  const roadTrip: SeasonalChecklistData = {
    id: 'roadtrip',
    title: 'Long Road Trip Check',
    icon: 'MapPin',
    color: '#10b981',
    items: [
      { id: 'r1', label: 'Oil Level & Condition', description: 'Check dipstick. Change if due within 1,000 miles.', warningLevel: 'warning', checked: false },
      { id: 'r2', label: 'Tire Pressure & Spare', description: 'All 4 tires + spare. Check tread depth too.', warningLevel: 'critical', checked: false },
      { id: 'r3', label: 'Brake Condition', description: 'Listen for squealing. Test stopping distance.', warningLevel: 'critical', checked: false },
      { id: 'r4', label: 'All Fluid Levels', description: 'Coolant, brake fluid, power steering, washer fluid.', warningLevel: 'warning', checked: false },
      { id: 'r5', label: 'Belts & Hoses', description: 'Look for cracks, fraying, or soft spots.', warningLevel: 'warning', checked: false },
      { id: 'r6', label: 'Lights & Signals', description: 'Headlights, brake lights, turn signals, hazards.', warningLevel: 'info', checked: false },
      { id: 'r7', label: 'Emergency Kit', description: 'Jumper cables, flashlight, first aid, water, phone charger.', warningLevel: 'info', checked: false },
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
  const ratio = repairCost / carValue
  const carAge = new Date().getFullYear() - carYear
  const isSafety = /brake|steering|tire|airbag|suspension|light/i.test(repairType)
  const isHighMileage = mileage > 150000
  const reasons: string[] = []

  // Safety items are always worth fixing
  if (isSafety) {
    reasons.push(`This is a safety-critical repair. It should be fixed regardless of car value.`)
  }

  if (ratio > 0.75) {
    reasons.push(`Repair cost (${Math.round(ratio * 100)}% of car value) is very high relative to the car's worth.`)
  } else if (ratio > 0.5) {
    reasons.push(`Repair is ${Math.round(ratio * 100)}% of your car's value — that's significant.`)
  } else {
    reasons.push(`Repair cost is ${Math.round(ratio * 100)}% of car value — reasonable range.`)
  }

  if (isHighMileage) {
    reasons.push(`At ${mileage.toLocaleString()} miles, other major components may need attention soon.`)
  }

  if (carAge > 12) {
    reasons.push(`At ${carAge} years old, consider the likelihood of additional repairs in the near future.`)
  }

  if (yearsToKeep <= 1) {
    reasons.push(`If you plan to keep it only ${yearsToKeep} year(s), the repair may not pay for itself.`)
  } else if (yearsToKeep >= 3) {
    reasons.push(`Planning to keep it ${yearsToKeep}+ years makes the repair more worthwhile.`)
  }

  if (condition === 'poor') {
    reasons.push(`The car's overall poor condition may make this repair less cost-effective.`)
  }

  // Verdict
  let verdict: RepairDecision['verdict']
  let title: string
  let color: string

  if (isSafety && ratio < 0.6) {
    verdict = 'worth_fixing'
    title = 'Worth Fixing'
    color = '#10b981'
  } else if (ratio > 0.75 && !isSafety) {
    verdict = isHighMileage || carAge > 15 ? 'consider_selling' : 'not_worth'
    title = verdict === 'consider_selling' ? 'Consider Selling / Trading' : 'Probably Not Worth It'
    color = verdict === 'consider_selling' ? '#f59e0b' : '#ef4444'
  } else if (ratio > 0.5 || (isHighMileage && carAge > 10)) {
    verdict = 'second_opinion'
    title = 'Get a Second Opinion'
    color = '#f59e0b'
  } else {
    verdict = 'worth_fixing'
    title = 'Worth Fixing'
    color = '#10b981'
  }

  return { verdict, title, color, reasons }
}

// ── Fluid Guide Data ─────────────────────────────────────────────────
export interface FluidInfo {
  id: string
  name: string
  icon: string
  color: string
  normalColor: string
  location: string
  howToCheck: string
  warningSigns: string[]
  doNot: string
  seeAMechanic: string
}

export const FLUID_GUIDE: FluidInfo[] = [
  {
    id: 'engine_oil', name: 'Engine Oil', icon: 'Droplets', color: '#92400e',
    normalColor: 'Amber / light brown (new) to dark brown (used)',
    location: 'Yellow dipstick handle, usually near the front of the engine.',
    howToCheck: 'Pull dipstick, wipe clean, reinsert fully, pull again. Oil should be between MIN and MAX marks.',
    warningSigns: ['Black and gritty texture', 'Milky or frothy appearance (possible coolant leak)', 'Very low level', 'Burning oil smell'],
    doNot: 'Never check oil immediately after driving — let the car sit for 5 minutes first.',
    seeAMechanic: 'If oil is milky, significantly low between changes, or you see metal particles.',
  },
  {
    id: 'coolant', name: 'Coolant / Antifreeze', icon: 'Thermometer', color: '#059669',
    normalColor: 'Green, orange, pink, or blue depending on type — should be translucent',
    location: 'Translucent reservoir tank near the radiator, marked with MIN/MAX.',
    howToCheck: 'Check the reservoir level when the engine is COLD. Should be between MIN and MAX.',
    warningSigns: ['Level drops repeatedly', 'Rusty or cloudy color', 'Sweet smell from engine bay', 'Temperature gauge runs hot'],
    doNot: 'NEVER open the radiator cap when the engine is hot — pressurized steam can cause serious burns.',
    seeAMechanic: 'If coolant is disappearing without visible leaks, or if the engine is overheating.',
  },
  {
    id: 'brake_fluid', name: 'Brake Fluid', icon: 'ShieldAlert', color: '#dc2626',
    normalColor: 'Clear to light yellow (fresh). Dark brown = old and needs replacing.',
    location: 'Small reservoir on top of the brake master cylinder, near the firewall on the driver\'s side.',
    howToCheck: 'Check level through the translucent reservoir. Should be between MIN and MAX marks.',
    warningSigns: ['Dark brown or black color', 'Level significantly below MIN', 'Spongy brake pedal', 'Brake warning light on'],
    doNot: 'Don\'t let brake fluid contact paint — it strips automotive paint. Don\'t leave the cap off (it absorbs moisture).',
    seeAMechanic: 'If fluid is dark, level keeps dropping, or brake pedal feels soft.',
  },
  {
    id: 'power_steering', name: 'Power Steering Fluid', icon: 'RotateCw', color: '#7c3aed',
    normalColor: 'Clear, amber, or light red — should not be dark or foamy',
    location: 'Small reservoir with a cap labeled "Power Steering" near the serpentine belt area.',
    howToCheck: 'Some have a dipstick in the cap, others have MIN/MAX marks on the reservoir.',
    warningSigns: ['Whining noise when turning', 'Stiff steering', 'Fluid is dark or has particles', 'Low level'],
    doNot: 'Don\'t use the wrong type — ATF and power steering fluid are not always interchangeable.',
    seeAMechanic: 'If steering is making noise or if fluid keeps disappearing (possible leak in the rack).',
  },
  {
    id: 'washer_fluid', name: 'Windshield Washer Fluid', icon: 'Droplet', color: '#0ea5e9',
    normalColor: 'Blue, purple, or orange — color varies by brand',
    location: 'Large reservoir with a windshield/water icon on the cap. Usually near the front fender.',
    howToCheck: 'Open cap and look inside. Refill when low. Use proper washer fluid, not just water.',
    warningSigns: ['Empty reservoir', 'Nozzles clogged (no spray)', 'Frozen in winter (use winter-rated fluid)'],
    doNot: 'Don\'t use plain water — it freezes in winter and doesn\'t clean well. Don\'t use dish soap.',
    seeAMechanic: 'Only if nozzles are broken or the pump motor has failed.',
  },
  {
    id: 'transmission', name: 'Transmission Fluid', icon: 'Cog', color: '#e11d48',
    normalColor: 'Bright red (new) to dark red/brown (used). Should not smell burnt.',
    location: 'Some cars have a dipstick (often red handle). Many newer cars are sealed (dealer-only).',
    howToCheck: 'If accessible: engine running, in Park, pull dipstick. Check level and color.',
    warningSigns: ['Dark brown or black color', 'Burnt smell', 'Slipping gears', 'Delayed shifts', 'Transmission warning light'],
    doNot: 'Don\'t overfill — too much fluid causes foaming and erratic shifting.',
    seeAMechanic: 'If fluid smells burnt, looks very dark, or you notice any shifting problems.',
  },
]
