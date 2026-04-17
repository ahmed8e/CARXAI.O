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
    title: 'Why Your Car Shakes When Braking',
    lastUpdated: 'May 24, 2024',
    readingTime: '7 min read',
    shortAnswer: 'If you feel your car shaking or vibrating specifically when you step on the brakes, it usually indicates an issue with your brake rotors, calipers, or suspension. More likely than not, the problem is related to "warped" rotors or uneven pad deposits creating a physical pulsation. While a light vibration might only be a nuisance at first, any significant shaking can reduce your braking effectiveness and often points to a safety risk that becomes more serious if ignored.',
    keyTakeaways: [
      'Most common cause: Warped front brake rotors or uneven brake pad deposits.',
      'Identification: Steering wheel shakes usually point to front brakes; pedal pulsation often points to rear brakes.',
      'Safety: Driving with a light shake for a short distance may be possible, but stop driving if the car pulls hard or the pedal feels soft.',
      'Next Steps: A visual inspection of the rotors and checking for sticking calipers should be your first priority.'
    ],
    severity: 'Medium',
    canDrive: 'Caution',
    likelyCauses: [
      'Warped Brake Rotors',
      'Uneven Brake Pad Deposits',
      'Sticking Brake Caliper',
      'Worn Suspension Bushings',
      'Loose Wheel Hub or Lug Nuts'
    ],
    quickSummary: {
      canYouDrive: 'Avoid high speeds; get inspected soon.',
      urgency: 'Medium - Safety systems are compromised.',
      causes: ['Front Rotors', 'Brake Pads', 'Caliper Stick'],
      stopIf: 'The pedal sinks, you hear grinding, or the car pulls to one side.'
    },
    repairCosts: {
      low: '$150 - $300',
      lowDesc: 'Single axle brake pad replacement.',
      medium: '$400 - $750',
      mediumDesc: 'Full front brake service (pads and high-quality rotors).',
      high: '$1,200+',
      highDesc: 'Brake overhaul including calipers and hydraulic lines.'
    },
    sections: [
      {
        title: 'Common Reasons Your Car Shakes When Braking',
        content: 'Understanding why your car is shaking starts with the mechanical components that actually do the stopping. When any part of the brake assembly loses its perfectly flat surface or smooth movement, you will feel it through the steering wheel or pedal.',
        image: '/images/guides/brake-system-overview.png',
        imageAlt: 'Diagram of a car disc brake system showing rotor, pads, and caliper assembly.',
        subsections: [
          {
            title: 'Warped Brake Rotors',
            content: 'This is the most frequent culprit. Rotors warp when they get too hot—often from stop-and-go traffic or "riding" the brakes downhill. Instead of a flat surface for the pads to grip, the rotor develops a slight wavy shape. As the pads hit these "high spots," they bounce, creating the shaking sensation you feel.',
            severity: 'Medium'
          },
          {
            title: 'Uneven Brake Pad Deposits',
            content: 'Sometimes the rotor isn\'t actually bent, but "friction material" from the pads has melted onto the rotor surface unevenly. This usually happens if you make a very hard stop and then keep your foot pressed firmly on the brake while stationary. The heat can "stamp" the pad material onto the rotor.',
            severity: 'Low'
          },
          {
            title: 'Sticking Brake Caliper',
            content: 'If a caliper is stuck, it may keep the brake pads partially pressed against the rotor even when you aren\'t braking. This creates extreme heat, which eventually warps the rotor and causes the car to shake when you finally do apply the brakes.',
            severity: 'High'
          }
        ]
      },
      {
        title: 'How to Tell What the Shake Most Likely Means',
        content: 'The location and timing of the vibration are your best clues for a quick diagnosis. Pay close attention to where you feel the sensation first.',
        image: '/images/guides/vibration-clues.png',
        imageAlt: 'Diagnostic visual showing hands on a shaking steering wheel vs a foot on a vibrating pedal.',
        subsections: [
          {
            title: 'Steering wheel shakes when braking',
            clue: 'Vibration felt primarily in your hands.',
            content: 'If the steering wheel shakes, the problem often points to your front brakes. Since your front wheels are connected directly to the steering rack, any rotor run-out or suspension play in the front end is transmitted immediately to your hands.',
            safeToDrive: 'Short drive to a shop is likely safe.'
          },
          {
            title: 'Brake pedal vibrates when braking',
            clue: 'Pulsation felt through the sole of your foot.',
            content: 'Pedal-only vibration usually indicates an issue with the rear rotors. While less urgent than front-end shakes, it still means your rear braking force is inconsistent.',
            safeToDrive: 'Safe for moderate distances.'
          },
          {
            title: 'Car shakes when braking at high speed',
            clue: 'Shake appears at 50+ MPH but disappears at lower speeds.',
            content: 'High-speed vibration is the classic sign of "run-out" that hasn\'t become severe yet. At lower speeds, the frequency is too slow to notice, but as the wheels spin faster, the imperfection hits the pads more times per second, creating a resonant vibration.',
            safeToDrive: 'Avoid highway speeds until repaired.'
          },
          {
            title: 'Car pulls to one side when braking',
            clue: 'Vehicle drifts or dives left or right when slowing down.',
            content: 'This is a more serious symptom that usually indicates a seized caliper or a collapsed brake hose. One side is braking harder than the other, which can make the car unstable in an emergency.',
            safeToDrive: 'Stop driving; this is a safety risk.'
          },
          {
            title: 'Car shakes after brake replacement',
            clue: 'Vibration started within 50 miles of a brake job.',
            content: 'If the car shakes after a replacement, it is more likely that the wheel hub wasn\'t cleaned properly before the new rotor was seated, or the lug nuts were tightened unevenly. Improper wheel torque is a common cause of "instant" warping.',
            safeToDrive: 'Return to the technician to check lug torque.'
          },
          {
            title: 'ABS light on and car shakes when braking',
            clue: 'Orange ABS light is illuminated on the dash.',
            content: 'When the ABS light is on, the computer has detected a fault and may be pulsing the brakes incorrectly. This usually indicates a failing wheel speed sensor or a cracked tone ring.',
            safeToDrive: 'Caution: Anti-lock safety is disabled.'
          }
        ]
      },
      {
        title: 'Can You Drive If Your Car Shakes When Braking?',
        content: 'While a vibrating car can often be driven a short distance, it is not "safe" in the long term. Any shake means your tires aren\'t maintaining a perfect, consistent grip on the road during the most critical moment—when you need to stop. A short drive to a repair shop may be possible if the shake is light and the car brakes straight.',
        image: '/images/guides/warped-rotor.png',
        imageAlt: 'Technical diagram showing a warped rotor surface vs a healthy flat rotor.'
      },
      {
        title: 'When It Becomes Dangerous',
        image: '/images/guides/danger-signs.png',
        imageAlt: 'Visual checklist of brake danger signs: ABS light, pulling, grinding, and soft pedal.',
        content: 'You should stop driving immediately if you notice any of these "Red Flag" symptoms alongside the shaking:',
        subsections: [
          { title: 'Soft or Spongy Pedal', content: 'If the pedal sinks significantly or feels like you\'re stepping on a sponge, you have a hydraulic issue.' },
          { title: 'Grinding or Screeching', content: 'Metal-on-metal noise means your brake pads are completely gone, and you are damaging the rotors with every stop.' },
          { title: 'Burning Smell', content: 'A thin, chemical burning scent from the wheel area indicates a sticking caliper that is overheating.' },
          { title: 'Violent Pulling', content: 'If you have to fight the steering wheel to stay in your lane while slowing down.' }
        ]
      },
      {
        title: 'What To Check First',
        content: 'If you want to look for the cause yourself, focus on these visual and physical checks before calling a professional.',
        image: '/images/guides/precision-assembly.png',
        imageAlt: 'Close-up of a technician cleaning a wheel hub and using a torque wrench.',
        subsections: [
          { title: 'Visual Rotor Inspection', content: 'Look through your wheel spokes at the circular rotor. Check for blue-ish discoloration (heat spots) or deep circular grooves.' },
          { title: 'Wheel Hub Inspection', content: 'Check if any wheel is significantly hotter than the others after a typical drive. This often points to a sticking caliper.' },
          { title: 'Lug Nut Check', content: 'Ensure your lug nuts are tight and haven\'t backed off, which can cause both a shake and a safety hazard.' }
        ]
      }
    ],
    safetyAdvice: 'Brake vibration is a mechanical warning that one of your car\'s safety systems is failing. While it may start as a small vibration, it will eventually lead to longer stopping distances and potential loss of control. Always prioritize a brake inspection when you feel any change in your stopping performance.',
    whatToCheck: [
      {
        title: 'Quick Home Checks',
        items: [
          'Confirm if the shake is in the steering wheel or pedal.',
          'Note the speed where the vibration is most violent.',
          'Visually inspect rotors for heat spots (blue/purple tint).',
          'Check brake fluid level in the reservoir.'
        ]
      }
    ],
    faqs: [
      { question: 'Why does my car shake when i brake?', answer: 'It is most often due to warped brake rotors or uneven pad deposits creating a pulsing sensation as the brakes try to grip an uneven surface.' },
      { question: 'can i drive if my car shakes when braking?', answer: 'In the short term, yes, if the vibration is light. However, it will eventually damage your suspension and reduce your emergency stopping ability.' },
      { question: 'Why does my car shake when braking at high speed?', answer: 'The high frequency of rotation makes even minor rotor imperfections much more noticeable at highway speeds (55+ MPH).' },
      { question: 'How much does it cost to fix car shaking during braking?', answer: 'For most vehicles, a front brake job (pads and rotors) costs between $400 and $700 depending on the parts quality.' },
      { question: 'Will a wheel alignment fix the shaking?', answer: 'No. Wheel alignments fix "pulling" while driving or constant shakes, but shaking ONLY during braking is almost always a brake system issue.' },
      { question: 'Why is my steering wheel shakes when braking?', answer: 'This almost always points to a problem with the front rotors or front suspension components like tie rods.' },
      { question: 'What does a brake pedal pulsation mean?', answer: 'This is the physical feeling of the brake fluid being pushed back into the master cylinder as the pads try to climb over a high spot on a warped rotor.' },
      { question: 'Does a vibrating brake pedal mean ABS is working?', answer: 'It can. If you are on a slippery surface, the ABS rapidly pulses the brakes. If it happens on dry pavement during normal stops, it is a sign of a fault.' }
    ],
    metaTitle: 'Why Your Car Shakes When Braking: Causes, Safety & Fixes',
    metaDescription: 'Why does your car shake when you hit the brakes? Learn about warped rotors, sticking calipers, and when it is safe to drive this diagnostic guide.'
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
