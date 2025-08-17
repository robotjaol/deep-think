-- Seed data for Deep-Think platform
-- This file contains initial data for scenarios and learning resources

-- Insert sample learning resources
INSERT INTO public.learning_resources (title, type, url, domain, tags, relevance_keywords, description) VALUES
-- Cybersecurity resources
('NIST Cybersecurity Framework', 'paper', 'https://www.nist.gov/cyberframework', 'cybersecurity', ARRAY['framework', 'standards', 'risk-management'], ARRAY['incident-response', 'risk-assessment', 'security-controls'], 'Comprehensive framework for managing cybersecurity risks'),
('Incident Response Fundamentals', 'video', 'https://www.youtube.com/watch?v=example1', 'cybersecurity', ARRAY['incident-response', 'training'], ARRAY['breach-response', 'containment', 'recovery'], 'Essential training for cybersecurity incident response'),
('The Art of Memory Forensics', 'textbook', 'https://www.wiley.com/example', 'cybersecurity', ARRAY['forensics', 'investigation'], ARRAY['malware-analysis', 'memory-dump', 'investigation'], 'Advanced techniques for digital forensics and incident investigation'),

-- Healthcare resources
('Crisis Standards of Care', 'paper', 'https://www.iom.edu/example', 'healthcare', ARRAY['crisis-management', 'standards'], ARRAY['resource-allocation', 'triage', 'emergency'], 'Guidelines for healthcare delivery during crisis situations'),
('Emergency Department Management', 'case-study', 'https://www.nejm.org/example', 'healthcare', ARRAY['emergency-medicine', 'management'], ARRAY['patient-flow', 'resource-management', 'crisis'], 'Case studies in emergency department crisis management'),
('Pandemic Response Planning', 'textbook', 'https://www.cdc.gov/example', 'healthcare', ARRAY['pandemic', 'planning'], ARRAY['outbreak-response', 'public-health', 'containment'], 'Comprehensive guide to pandemic preparedness and response'),

-- Aerospace resources
('Aircraft Emergency Procedures', 'paper', 'https://www.faa.gov/example', 'aerospace', ARRAY['emergency-procedures', 'aviation'], ARRAY['system-failure', 'emergency-landing', 'crew-coordination'], 'Standard operating procedures for aircraft emergencies'),
('Human Factors in Aviation', 'textbook', 'https://www.aviation.com/example', 'aerospace', ARRAY['human-factors', 'safety'], ARRAY['decision-making', 'crew-resource-management', 'situational-awareness'], 'Understanding human performance in aviation environments'),
('Space Mission Crisis Management', 'case-study', 'https://www.nasa.gov/example', 'aerospace', ARRAY['space-missions', 'crisis'], ARRAY['mission-control', 'system-anomalies', 'contingency-planning'], 'Lessons learned from space mission emergencies'),

-- Finance resources
('Financial Crisis Management', 'paper', 'https://www.federalreserve.gov/example', 'finance', ARRAY['crisis-management', 'banking'], ARRAY['liquidity-crisis', 'risk-management', 'regulatory-response'], 'Central bank approaches to financial crisis management'),
('Operational Risk in Banking', 'textbook', 'https://www.riskbooks.com/example', 'finance', ARRAY['operational-risk', 'banking'], ARRAY['fraud-detection', 'business-continuity', 'compliance'], 'Managing operational risks in financial institutions'),
('Market Volatility Response', 'video', 'https://www.bloomberg.com/example', 'finance', ARRAY['market-volatility', 'trading'], ARRAY['risk-mitigation', 'portfolio-management', 'crisis-trading'], 'Strategies for managing portfolios during market crises');

-- Insert sample scenarios
INSERT INTO public.scenarios (title, domain, difficulty_level, config, is_active) VALUES
-- Cybersecurity scenario
('Data Breach Response', 'cybersecurity', 3, '{
  "id": "cyber-breach-001",
  "domain": "cybersecurity",
  "title": "Data Breach Response",
  "description": "A major data breach has been detected in your organization''s customer database. You must respond quickly to contain the damage and comply with regulations.",
  "initialState": {
    "id": "initial",
    "description": "Your security monitoring system has detected unusual database activity. Large amounts of customer data appear to have been accessed by an unauthorized user. The breach was discovered at 2:47 AM on a Friday night.",
    "context": "You are the Chief Information Security Officer (CISO) of a mid-sized e-commerce company with 500,000 customer records. Your company processes credit card transactions and stores personal information including names, addresses, phone numbers, and encrypted payment data.",
    "decisions": [
      {
        "id": "immediate-containment",
        "text": "Immediately shut down all database access to contain the breach",
        "consequences": ["System downtime", "Potential data loss prevention", "Business disruption"],
        "nextStateId": "containment-phase"
      },
      {
        "id": "investigate-first",
        "text": "Keep systems running while investigating the scope of the breach",
        "consequences": ["Continued potential data exposure", "Better forensic evidence", "Maintained business operations"],
        "nextStateId": "investigation-phase"
      },
      {
        "id": "partial-isolation",
        "text": "Isolate affected database servers while maintaining core operations",
        "consequences": ["Balanced approach", "Some business impact", "Reduced further exposure"],
        "nextStateId": "isolation-phase"
      }
    ],
    "timeLimit": 300000
  }
}', true),

-- Healthcare scenario
('Emergency Department Surge', 'healthcare', 4, '{
  "id": "healthcare-surge-001",
  "domain": "healthcare",
  "title": "Emergency Department Surge",
  "description": "A multi-vehicle accident has resulted in 15 casualties arriving simultaneously at your emergency department, which is already at 90% capacity.",
  "initialState": {
    "id": "initial",
    "description": "It''s 8:30 PM on a Saturday night. Your ED is already busy with typical weekend cases when you receive word that 15 casualties from a major highway accident are en route. ETA is 12 minutes. You have 3 trauma bays available and 2 are currently occupied.",
    "context": "You are the Emergency Department Director at a Level II trauma center. Your current staff includes 4 attending physicians, 6 nurses, and 2 residents. You have 25 total beds with 23 currently occupied.",
    "decisions": [
      {
        "id": "activate-disaster-protocol",
        "text": "Activate the hospital''s mass casualty incident protocol immediately",
        "consequences": ["Additional staff called in", "Resource reallocation", "Potential overreaction if injuries are minor"],
        "nextStateId": "disaster-protocol-active"
      },
      {
        "id": "discharge-stable-patients",
        "text": "Rapidly discharge stable patients to create capacity",
        "consequences": ["Increased bed availability", "Risk of premature discharge", "Staff focused on discharges"],
        "nextStateId": "rapid-discharge-phase"
      },
      {
        "id": "divert-ambulances",
        "text": "Request ambulance diversion to other hospitals for new arrivals",
        "consequences": ["Reduced patient load", "Potential delays for other emergencies", "Community impact"],
        "nextStateId": "diversion-active"
      }
    ],
    "timeLimit": 720000
  }
}', true),

-- Aerospace scenario
('Engine Failure During Takeoff', 'aerospace', 5, '{
  "id": "aerospace-engine-001",
  "domain": "aerospace",
  "title": "Engine Failure During Takeoff",
  "description": "You are the pilot-in-command of a commercial aircraft with 180 passengers. During takeoff roll at V1 speed, you experience a catastrophic failure of the left engine.",
  "initialState": {
    "id": "initial",
    "description": "Flight 447 is departing from a major hub airport on a clear morning. You''ve just reached V1 speed (decision speed) when you hear a loud bang and feel severe vibration. The left engine fire warning light illuminates, and you notice a significant yaw to the left.",
    "context": "You are flying a twin-engine aircraft (Boeing 737-800) with 180 passengers and 6 crew members. Weather is clear, runway is 10,000 feet long with 3,000 feet remaining. Your first officer is experienced, and air traffic control is monitoring.",
    "decisions": [
      {
        "id": "continue-takeoff",
        "text": "Continue takeoff and handle the emergency airborne (past V1)",
        "consequences": ["Standard procedure for post-V1", "Single-engine climb required", "Emergency landing needed"],
        "nextStateId": "airborne-emergency"
      },
      {
        "id": "abort-takeoff",
        "text": "Abort takeoff despite being past V1 speed",
        "consequences": ["Non-standard procedure", "High-speed runway overrun risk", "Immediate ground emergency"],
        "nextStateId": "rejected-takeoff"
      },
      {
        "id": "assess-situation",
        "text": "Take a moment to assess the exact nature of the failure",
        "consequences": ["Delayed decision", "Potential runway overrun", "Better situational awareness"],
        "nextStateId": "assessment-phase"
      }
    ],
    "timeLimit": 15000
  }
}', true);

-- Update scenarios to have a created_by value (will be null for seed data)
-- In a real application, these would be created by actual users