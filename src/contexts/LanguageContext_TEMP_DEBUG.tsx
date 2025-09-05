// DEBUGGING FILE - Identifying duplicate keys

console.log("=== DEBUGGING LANGUAGE CONTEXT DUPLICATES ===");

// Let me examine the structure and identify all duplicate keys
// This is a temporary file to understand the structure better

const testTranslations = {
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.services': 'Services',
    
    // SAFE BASE TRANSLATIONS - NO DUPLICATES
    'support.title': 'Support Client',
    'support.subtitle': 'Nous sommes là pour vous aider',
    
    'faq.title': 'Questions Fréquentes',
    
    'escrow.title': 'Coffre-fort Sécurisé KwendaPay',
    
    'system.loading': 'Chargement...',
    'system.error': 'Erreur',
    'system.success': 'Succès'
  },
  
  kg: {
    // Navigation
    'nav.home': 'Nzo',
    'nav.services': 'Kisalu',
    
    // KIKONGO TRANSLATIONS - UNIQUE KEYS
    'support_kg.title': 'Sadila ya ba clients',
    'support_kg.subtitle': 'Beto tuena fika mu kusadila beno',
    
    'faq_kg.title': 'Mituna miayitungwa mingi',
    
    'escrow_kg.title': 'Coffre ya mbanza ya KwendaPay',
    
    'system_kg.loading': 'Yina ku kanga...',
    'system_kg.error': 'Nkama',
    'system_kg.success': 'Malonga'
  },
  
  lua: {
    // Navigation
    'nav.home': 'Muetu',
    'nav.services': 'Bisalu',
    
    // TSHILUBA TRANSLATIONS - UNIQUE KEYS
    'support_lua.title': 'Kusadila ba clients',
    'support_lua.subtitle': 'Twena apa mukusadila',
    
    'faq_lua.title': 'Mibalo mibenga',
    
    'escrow_lua.title': 'Coffre ya mbanza ya KwendaPay',
    
    'system_lua.loading': 'Kuntala...',
    'system_lua.error': 'Nshimu',
    'system_lua.success': 'Malonga'
  },
  
  sw: {
    // Navigation
    'nav.home': 'Nyumbani',
    'nav.services': 'Huduma',
    
    // KISWAHILI TRANSLATIONS - UNIQUE KEYS
    'support_sw.title': 'Huduma za Wateja',
    'support_sw.subtitle': 'Tuko hapa kukusaidia',
    
    'faq_sw.title': 'Maswali ya Mara kwa Mara',
    
    'escrow_sw.title': 'Akiba Salama ya KwendaPay',
    
    'system_sw.loading': 'Inapakia...',
    'system_sw.error': 'Hitilafu',
    'system_sw.success': 'Mafanikio'
  }
};

console.log("Structure analysis complete");
export default testTranslations;