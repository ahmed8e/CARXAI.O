export interface Guide {
  id: string;
  slug: string;
  category: string;
  categoryDisplay: string;
  title: string;
  shortAnswer: string;
  keyTakeaways?: string[];
  authorName?: string;
  lastUpdated?: string;
  reviewerName?: string;
  reviewerTitle?: string;
  readingTime?: string;
  severity: 'Low' | 'Medium' | 'High';
  canDrive: 'Yes' | 'Caution' | 'No';
  likelyCauses: string[];
  quickSummary?: {
    canYouDrive: string;
    urgency: string;
    causes: string[];
    stopIf: string;
  };
  repairCosts?: {
    title?: string;
    disclaimer?: string;
    low: string;
    lowDesc?: string;
    medium: string;
    mediumDesc?: string;
    high: string;
    highDesc?: string;
  };
  sections: {
    title: string;
    content: string;
    image?: string;
    imageAlt?: string;
    subsections?: { 
      title: string; 
      content: string;
      severity?: 'Low' | 'Medium' | 'High';
      safeToDrive?: string;
      clue?: string;
    }[];
  }[];
  diagnosticComparisons?: {
    symptom: string;
    likelyCause: string;
    clue: string;
  }[];
  safetyAdvice: string;
  whatToCheck: {
    title: string;
    items: string[];
  }[];
  faqs: { question: string; answer: string }[];
  metaTitle: string;
  metaDescription: string;
  brand?: string;
  expertQuote?: string;
  accuracyLabel?: string;
}

export const GUIDE_CATEGORIES = [
  { id: 'symptoms', name: 'Symptoms', icon: 'Activity' },
  { id: 'warning-lights', name: 'Warning Lights', icon: 'ShieldAlert' },
  { id: 'starting-battery', name: 'Starting & Battery', icon: 'Zap' },
  { id: 'braking-problems', name: 'Braking Problems', icon: 'AlertTriangle' },
  { id: 'heating-ac', name: 'Heating & AC', icon: 'Thermometer' },
  { id: 'brands', name: 'Brand-Specific', icon: 'LayoutDashboard' }
];

export const guides: Guide[] = [
  {
    id: '1',
    slug: 'car-shakes-when-braking',
    category: 'braking-problems',
    categoryDisplay: 'Brake System Diagnosis',
    title: 'Car shakes when braking',
    lastUpdated: 'May 24, 2024',
    readingTime: '7 min read',
    shortAnswer: 'If your car shakes specifically when you brake, the problem more often comes from uneven braking force rather than a general driving vibration. In many cases, the cause is warped front rotors, uneven pad deposits, or a sticking caliper, but suspension or wheel-related problems can also make the symptom worse. A light shake may still allow a short drive, but strong vibration, pulling, or a soft pedal should be treated as a safety issue.',
    keyTakeaways: [
      'More likely: Warped front brake rotors or uneven pad deposits.',
      'Front-end check: Steering wheel shakes often point to front brake or suspension issues.',
      'Pedal-only: Often points to rotor thickness variation or uneven deposits.',
      'Warning: Strong vibration, pulling, or a soft pedal are safety issues.'
    ],
    severity: 'Medium',
    canDrive: 'Caution',
    likelyCauses: [
      'Warped Brake Rotors',
      'Uneven Brake Pad Deposits',
      'Sticking Brake Caliper',
      'Worn Suspension Bushings',
      'Incorrect Wheel Torque'
    ],
    quickSummary: {
      canYouDrive: 'Caution - Use common sense on speed.',
      urgency: 'Medium - Safety system may be compromised.',
      causes: ['Front Rotors', 'Brake Pads', 'Caliper Stick'],
      stopIf: 'The pedal feels soft, you hear grinding, or the car pulls to one side.'
    },
    repairCosts: {
      title: 'Typical Repair Cost Ranges',
      disclaimer: 'Costs vary by vehicle, brake design, labor rates, and whether the problem is limited to pads and rotors or involves calipers, ABS components, or front-end parts.',
      low: '$150 - $300',
      lowDesc: 'Brake pad replacement (single axle).',
      medium: '$400 - $750',
      mediumDesc: 'Standard front brake service (pads + rotors).',
      high: '$1,200+',
      highDesc: 'Full hydraulic/caliper overhaul.'
    },
    sections: [
      {
        title: 'Quick Answer',
        content: 'If your car shakes specifically when you brake, the problem more often comes from uneven braking force rather than a general driving vibration. In many cases, the cause is warped front rotors, uneven pad deposits, or a sticking caliper, but suspension or wheel-related problems can also make the symptom worse. A light shake may still allow a short drive, but strong vibration, pulling, or a soft pedal should be treated as a safety issue.',
        image: '/images/guides/brake-rotor-wear.png',
        imageAlt: 'A used brake rotor showing heat spots and uneven wear patterns on the surface.'
      },
      {
        title: 'How the vibration feels',
        content: 'Identifying where you feel the vibration is the first step in a realistic diagnosis. The sensation often transfers through different parts of the car depending on which corner is failing.',
        subsections: [
          {
            title: 'In the steering wheel',
            content: 'If the steering wheel shakes more than the brake pedal, the issue more often points to the front brakes or front-end suspension, because front brake vibration is transferred directly into the steering system.',
            clue: 'Vibration often increases at specific speeds.'
          },
          {
            title: 'In the brake pedal',
            content: 'Pedal-only vibration often points to rotor thickness variation, uneven pad deposits, or ABS-related pulsation, depending on when the vibration happens and whether it appears during normal braking or only during hard stops.',
            clue: 'Felt most on light to medium braking.'
          },
          {
            title: 'Whole car vibration',
            content: 'If the entire chassis seems to shudder, the rear brakes or larger suspension components like control arm bushings are more likely the culprit.',
            clue: 'Worse when there are passengers in the back.'
          }
        ]
      },
      {
        title: 'Most likely causes (by situation)',
        content: 'Don\'t just look at parts—look at when the shaking happens. Real-world symptoms often point to specific failure points.',
        image: '/images/guides/mechanic-inspection.png',
        imageAlt: 'A mechanic using a flashlight to inspect the condition of rotors and pads.',
        subsections: [
          {
            title: 'If it happens at medium or high speed',
            content: 'If the shake shows up mostly at medium or highway speed, rotor run-out or uneven rotor thickness becomes more likely, especially if the vibration is much weaker during low-speed stops.',
            severity: 'Medium'
          },
          {
            title: 'If it happens during light braking',
            content: 'Often points to uneven pad deposits. The "friction material" from your pads may have melting onto the rotor surface in patches, causing the pads to catch and release.',
            severity: 'Low'
          },
          {
            title: 'If the steering wheel shakes violently',
            content: 'This is a more serious symptom that often points to a seized caliper, uneven braking force, or a brake hose problem causing one side to brake harder than the other.',
            severity: 'High'
          },
          {
            title: 'If it started soon after a brake job',
            content: 'If the vibration starts soon after a brake job, improper wheel torque, dirt or corrosion on the wheel hub, or rotor installation issues become more likely than normal rotor wear.',
            severity: 'Medium'
          },
          {
            title: 'If the ABS light is on',
            content: 'When the ABS light is on, the system has detected a fault, and the vibration may be related to incorrect ABS modulation, a wheel speed sensor issue, or a damaged tone ring.',
            severity: 'Medium'
          }
        ]
      },
      {
        title: 'Can you drive?',
        content: 'A short drive may be possible if the shake is light, the car still brakes straight, and there is no grinding, burning smell, soft pedal, or warning light. You should stop driving if the vibration becomes strong, the car pulls to one side, or braking feels weaker than normal.',
        image: '/images/guides/brake-assembly.png',
        imageAlt: 'Detailed view of a wheel assembly with the rim removed, showing the caliper and rotor contact point.',
        subsections: [
          {
            title: 'Status: Safe for short trips',
            content: 'The shake is light, the car still stops straight, and there is no noise or change in pedal pressure.',
            safeToDrive: 'Short drive to a local shop may be possible.'
          },
          {
            title: 'Status: Risky / Caution',
            content: 'The shake is strong enough to feel it through the seat, or it only happens at highway speeds. Vibration often indicates building heat.',
            safeToDrive: 'Avoid highways; get inspected as soon as possible.'
          },
          {
            title: 'Status: Stop Driving',
            content: 'The car pulls hard to one side when braking, the pedal feels soft or inconsistent, or you hear metal-on-metal grinding.',
            safeToDrive: 'Stop immediately. Driving becomes a significant safety risk.'
          }
        ]
      }
    ],
    safetyAdvice: 'Brake vibration is often a mechanical warning that your safety systems are degrading. If braking distance increases, the steering becomes unstable, or the pedal feels inconsistent from one stop to the next, the problem should be treated as a safety issue rather than a comfort issue. While you may still be able to stop, your car will not react as predictably in a panic situation.',
    whatToCheck: [
      {
        title: 'Immediate Checklist',
        items: [
          'Verify if shake is in wheel or pedal',
          'Check for raw fuel smell or burning brake smell',
          'Visually inspect rotors for blue/purple heat spots',
          'Note if vibration happens at specific speeds'
        ]
      }
    ],
    faqs: [
      { question: 'Why does my car shake when I brake?', answer: 'It is more likely due to warped front brake rotors or uneven pad deposits rather than a general driving vibration.' },
      { question: 'Can I drive if my car shakes when braking?', answer: 'A short drive may be possible if the shake is light and the car brakes straight, but strong vibration should be treated as a safety issue.' },
      { question: 'Will a wheel balance fix the shake?', answer: 'No. Shaking ONLY during braking usually points to a brake issue, while a bad balance usually causes a constant shake at certain speeds.' }
    ],
    metaTitle: 'Why Your Car Shakes When Braking: Causes, Safety & Fixes',
    metaDescription: 'Why does your car shake when you hit the brakes? Learn about warped rotors, sticking calipers, and when it is safe to drive in this diagnostic guide.'
  },

  {
    id: '2',
    slug: 'car-smells-like-gas',
    category: 'symptoms',
    categoryDisplay: 'Engine & Fuel Systems',
    title: 'Why Does My Car Smell Like Gas?',
    shortAnswer: 'A persistent gasoline smell is usually caused by a fuel leak, a faulty gas cap, or an issue with the evaporative emissions (EVAP) system. Because gasoline is highly flammable, any raw fuel smell should be treated as an emergency.',
    authorName: 'CarxAI Editorial Team',
    lastUpdated: 'June 10, 2024',
    reviewerName: 'David Miller',
    reviewerTitle: 'ASE Master Technician',
    readingTime: '5 min read',
    severity: 'High',
    canDrive: 'No',
    likelyCauses: ['Fuel Line Leak', 'Faulty Gas Cap', 'Failed Fuel Injector', 'EVAP System Leak'],
    sections: [
      {
        title: 'Identifying the Source',
        content: 'Where and when you smell gas can help pinpoint the leak.',
        subsections: [
          { title: 'Inside the cabin while driving', content: 'Could indicate a leak in the engine bay pulling fumes through the AC vents.' },
          { title: 'Outside near the rear', content: 'Often a gas tank seal or fuel pump issue.' }
        ]
      }
    ],
    safetyAdvice: 'Fuel leaks are an immediate fire hazard. Do not smoke or use open flames near the vehicle. If the smell is strong, do not start the engine.',
    whatToCheck: [
      {
        title: 'Safety Checks',
        items: ['Visually inspect under the car for puddles', 'Ensure gas cap is tight', 'Check for raw fuel smell in the engine bay']
      }
    ],
    faqs: [
      { question: 'Could it just be the exhaust?', answer: 'Raw fuel smell is distinct from exhaust smell. If it smells like the pump at the gas station, it is likely a raw fuel leak.' }
    ],
    metaTitle: 'Common Causes for Gas Smell in Cars | CarxAI Safety Guide',
    metaDescription: 'Smelling gas while driving or parked? Discover the safety risks and common causes, including fuel leaks and EVAP issues.'
  },
  {
    id: '3',
    slug: 'car-wont-crank',
    category: 'starting-battery',
    categoryDisplay: 'Starting & Electrical',
    title: 'Car Won’t Crank: Troubleshooting Start Issues',
    shortAnswer: 'If you turn the key and nothing happens (no sound), the problem is most likely a dead battery, a failed starter, or a bad ignition switch. This usually requires a battery test as the first diagnostic step.',
    authorName: 'CarxAI Editorial Team',
    lastUpdated: 'July 5, 2024',
    reviewerName: 'David Miller',
    reviewerTitle: 'ASE Master Technician',
    readingTime: '6 min read',
    severity: 'Medium',
    canDrive: 'No',
    likelyCauses: ['Dead Battery', 'Faulty Starter Motor', 'Bad Ignition Switch', 'Blown Main Fuse'],
    sections: [
      {
        title: 'Common Symptoms',
        content: 'Listen closely to what happens when you try to start the car.',
        subsections: [
          { title: 'Single Click', content: 'Usually indicates a starter solenoid trying to engage but lacking power or failing mechanically.' },
          { title: 'Rapid Clicking', content: 'The classic sign of a battery with just enough juice to trigger the relay but not enough to turn the engine.' }
        ]
      }
    ],
    safetyAdvice: 'If you are stranded, ensure you are in a safe location. If using jumper cables, follow the manual to avoid electrical surges.',
    whatToCheck: [
      {
        title: 'Quick Diagnosis',
        items: ['Check battery terminal tightness', 'Try a jump start', 'Listen for the fuel pump prime when key is in ON position']
      }
    ],
    faqs: [
      { question: 'Can a bad alternator cause this?', answer: 'Yes, if the alternator failed while driving, the battery will be drained, preventing a restart.' }
    ],
    metaTitle: 'Car Won’t Crank? Diagnostic and Fix Guide | CarxAI',
    metaDescription: 'Stranded because your car won\'t turn over? Learn how to tell the difference between a dead battery, a bad starter, and ignition problems.'
  },
  {
    id: '4',
    slug: 'wont-start-but-lights-come-on',
    category: 'starting-battery',
    categoryDisplay: 'Battery & Electronics',
    title: 'Car Won’t Start But Lights Come On',
    shortAnswer: 'When your lights and dash work but the engine won\'t turn, the battery may have enough voltage for electronics but not enough amperage for the starter. This is a common source of confusion for drivers.',
    authorName: 'CarxAI Editorial Team',
    lastUpdated: 'August 12, 2024',
    reviewerName: 'David Miller',
    reviewerTitle: 'ASE Master Technician',
    readingTime: '4 min read',
    severity: 'Medium',
    canDrive: 'No',
    likelyCauses: ['Weak Battery', 'Corroded Terminals', 'Neutral Safety Switch', 'Immobilizer/Key Fault'],
    sections: [
      {
        title: 'The Amperage Gap',
        content: 'Starting an engine requires hundreds of amps, while lights only require a few. This is why electronics can work on a battery that is effectively dead for starting purposes.'
      }
    ],
    safetyAdvice: 'Ensure the car is in Park or Neutral. A faulty safety switch might prevent starting if it thinks the car is in gear.',
    whatToCheck: [
      {
        title: 'Observation Steps',
        items: ['Clean battery terminals', 'Try starting in Neutral (for automatics)', 'Check the key fob battery']
      }
    ],
    faqs: [
      { question: 'Is it the starter?', answer: 'If you hear a loud "thud" or click but the engine doesn\'t turn, and the lights stay bright, the starter is a high suspect.' }
    ],
    metaTitle: 'Car Won\'t Start but Electronics Work | CarxAI Guide',
    metaDescription: 'Dashboard lights are on but the car won\'t start? Find out why your battery might be too weak to crank the engine but strong enough for lights.'
  },
  {
    id: '5',
    slug: 'abs-light-in-car',
    category: 'warning-lights',
    categoryDisplay: 'Safety Systems',
    title: 'ABS Light On: Meaning and Urgency',
    shortAnswer: 'The ABS light indicates a fault in the Anti-lock Braking System. Your normal brakes will still work, but you won\'t have anti-lock capability in emergencies. This requires scanning the vehicle for a trouble code.',
    authorName: 'CarxAI Editorial Team',
    lastUpdated: 'September 2, 2024',
    reviewerName: 'David Miller',
    reviewerTitle: 'ASE Master Technician',
    readingTime: '5 min read',
    severity: 'Medium',
    canDrive: 'Caution',
    likelyCauses: ['Dirty Wheel Speed Sensor', 'Failing ABS Module', 'Low Brake Fluid', 'Blown ABS Fuse'],
    sections: [
      {
        title: 'How ABS Works',
        content: 'ABS prevents wheel lock-up during hard braking, allowing you to maintain steering control. If the light is on, the computer has disabled this safety feature.'
      }
    ],
    safetyAdvice: 'Drive with extra caution in wet or slippery conditions. Avoid sudden braking as the wheels may lock up, causing a skid.',
    whatToCheck: [
      {
        title: 'Visual Inspection',
        items: ['Check brake fluid level', 'Inspect wheel speed sensor wires', 'Check the ABS fuse']
      }
    ],
    faqs: [
      { question: 'Is it safe to drive with the ABS light on?', answer: 'Yes, but be aware that your safety net for panic stops is gone. Get it scanned as soon as possible.' }
    ],
    metaTitle: 'What Does the ABS Light Mean? | CarxAI Warning Guide',
    metaDescription: 'Understand why your ABS light is on. From wheel sensors to fluid levels, learn if it is safe to drive and how to fix the anti-lock system.'
  },
  {
    id: '6',
    slug: 'oil-light-in-car',
    category: 'warning-lights',
    categoryDisplay: 'Critical Warnings',
    title: 'Oil Light On: Stop Immediately',
    shortAnswer: 'A red oil can icon means your engine has lost oil pressure. This is a critical emergency that can destroy your engine in seconds. PULL OVER NOW.',
    authorName: 'CarxAI Editorial Team',
    lastUpdated: 'October 15, 2024',
    reviewerName: 'David Miller',
    reviewerTitle: 'ASE Master Technician',
    readingTime: '3 min read',
    severity: 'High',
    canDrive: 'No',
    likelyCauses: ['Low Oil Level', 'Failed Oil Pump', 'Blocked Oil Pickup', 'Faulty Pressure Sensor'],
    sections: [
      {
        title: 'Pressure vs Level',
        content: 'While low oil level can cause the light, the light itself monitors PRESSURE. Without pressure, oil cannot reach the top of the engine, leading to catastrophic metal-on-metal contact.'
      }
    ],
    safetyAdvice: 'PULL OVER IMMEDIATELY. Turn off the engine as soon as it is safe to do so. Do not attempt to drive to a shop.',
    whatToCheck: [
      {
        title: 'Initial Checks',
        items: ['Check the dipstick level', 'Look for large oil leaks under the car', 'Check for blue smoke or knocking noises']
      }
    ],
    faqs: [
      { question: 'Can I drive just a few miles?', answer: 'No. Driving even a few minutes without oil pressure will cause permanent engine damage costings thousands.' }
    ],
    metaTitle: 'Oil Pressure Light Guide: What to Do | CarxAI',
    metaDescription: 'Red oil light on your dash? This is an engine emergency. Learn why you must stop immediately and how to check your oil level safely.'
  },
  {
    id: '7',
    slug: 'car-shakes-when-driving',
    category: 'symptoms',
    categoryDisplay: 'Drivetrain Symptoms',
    title: 'Car Shakes When Driving (But Not Braking)',
    shortAnswer: 'If your car vibrates while cruising or accelerating, it is likely a wheel balance issue, a bent rim, or a failing cv axle rather than a brake problem. This often varies with vehicle speed.',
    authorName: 'CarxAI Editorial Team',
    lastUpdated: 'November 22, 2024',
    reviewerName: 'David Miller',
    reviewerTitle: 'ASE Master Technician',
    readingTime: '6 min read',
    severity: 'Medium',
    canDrive: 'Caution',
    likelyCauses: ['Unbalanced Wheels', 'Bent Rim', 'Failing CV Axle', 'Engine Misfire'],
    sections: [
      {
        title: 'Cruising vs Accelerating',
        content: 'Vibration that stops when you let off the gas often points to the drivetrain, while constant vibration is usually wheel-related.'
      }
    ],
    safetyAdvice: 'Excessive vibration can lead to premature tire wear and suspension failure. Have your wheel balance checked first.',
    whatToCheck: [
      {
        title: 'Observation Steps',
        items: ['Check for missing wheel weights', 'Inspect tires for "cupping" or flat spots', 'Check CV axle boots for leaks']
      }
    ],
    faqs: [],
    metaTitle: 'Why Does My Car Shake While Driving? | CarxAI',
    metaDescription: 'Is your car vibrating at highway speeds? Learn the difference between wheel balance issues and drivetrain faults.'
  },
  {
    id: '8',
    slug: 'burning-smell-from-car',
    category: 'symptoms',
    categoryDisplay: 'Odor & Hazard Diagnosis',
    title: 'Burning Smell From Car: Common Causes',
    shortAnswer: 'A burning smell can range from a spilled oil to a sticking brake caliper or an electrical short. Identifying the "scent" is the first step in diagnosis.',
    authorName: 'CarxAI Editorial Team',
    lastUpdated: 'December 4, 2024',
    reviewerName: 'David Miller',
    reviewerTitle: 'ASE Master Technician',
    readingTime: '6 min read',
    severity: 'High',
    canDrive: 'No',
    likelyCauses: ['Sticking Brake Caliper', 'Oil Leak on Exhaust', 'Slipping Clutch', 'Electrical Short'],
    sections: [
      {
        title: 'Identify the Scent',
        content: 'Acrid smoke (electrical), sweet smell (coolant), or thick "burnt toast" smell (clutch/brakes).'
      }
    ],
    safetyAdvice: 'If you see smoke or smell electrical burning, pull over immediately and disconnect the battery if safe.',
    whatToCheck: [
      {
        title: 'Detection List',
        items: ['Check for smoke under the hood', 'Feel wheels for excessive heat (brakes)', 'Check for oil drips on the manifold']
      }
    ],
    faqs: [],
    metaTitle: 'Burning Smell from Car: Diagnosis & Safety | CarxAI',
    metaDescription: 'Smell something burning? Learn how to identify oil leaks, brake drag, and electrical issues before they become dangerous.'
  }
];
