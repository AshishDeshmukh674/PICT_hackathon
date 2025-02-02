// Dictionary of doctor types with their descriptions and common conditions treated
const doctorTypes = {
  GENERAL_PHYSICIAN: {
        keywords: ['general', 'fever', 'cold', 'cough', 'flu', 'headache', 'body pain', 'weakness'],
        specialties: ['Diagnosis and treatment of common illnesses', 'General health checkups', 'Preventive care', 'Management of chronic diseases like diabetes and hypertension', 'Basic wound care', 'Prescription of medications', 'Referral to specialists if needed'],
        alternateNames: ['General Practitioner', 'Primary Care Physician', 'Family Doctor', 'Internist']
    },
    PULMONOLOGIST: {
        keywords: ['lung', 'breathing', 'respiratory', 'asthma', 'pneumonia', 'bronchitis'],
        specialties: ['Diagnosis and treatment of lung diseases', 'Asthma management', 'COPD (Chronic Obstructive Pulmonary Disease) treatment', 'Pulmonary function testing', 'Sleep apnea treatment', 'Bronchoscopy procedures', 'Tuberculosis (TB) management'],
        alternateNames: ['Lung Specialist', 'Respiratory Physician', 'Chest Physician', 'Pulmonary Doctor']
    },
    'Primary Care': {
      description: 'General healthcare provider for routine checkups and basic medical care',
      specialties: ['Annual physicals', 'Preventive care', 'Basic illness treatment'],
      alternateNames: ['General Practitioner', 'Family Doctor', 'GP']
    },
    'Cardiologist': {
      description: 'Specialist in heart and cardiovascular system',
      specialties: ['Heart disease', 'High blood pressure', 'Arrhythmia'],
      alternateNames: ['Heart Specialist', 'Heart Doctor']
    },
    'Dermatologist': {
      description: 'Specialist in skin, hair, and nail conditions',
      specialties: ['Acne', 'Skin cancer', 'Psoriasis'],
      alternateNames: ['Skin Doctor', 'Skin Specialist']
    },
    'Neurologist': {
      description: 'Specialist in brain and nervous system disorders',
      specialties: ['Headaches', 'Epilepsy', 'Multiple sclerosis'],
      alternateNames: ['Brain Specialist', 'Nerve Doctor']
    },
    'Orthopedist': {
      description: 'Specialist in bones, joints, and muscles',
      specialties: ['Fractures', 'Arthritis', 'Joint pain'],
      alternateNames: ['Bone Doctor', 'Orthopedic Surgeon']
    },
    'Pediatrician': {
      description: 'Specialist in child and adolescent healthcare',
      specialties: ['Child development', 'Childhood illnesses', 'Vaccinations'],
      alternateNames: ['Child Doctor', 'Child Specialist']
    },
    'Psychiatrist': {
      description: 'Specialist in mental health and behavioral disorders',
      specialties: ['Depression', 'Anxiety', 'Bipolar disorder'],
      alternateNames: ['Mental Health Doctor', 'Mental Health Specialist']
    },
    'ENT': {
      description: 'Specialist in ear, nose, and throat conditions',
      specialties: ['Hearing loss', 'Sinusitis', 'Tonsillitis'],
      alternateNames: ['Otolaryngologist', 'Ear Nose Throat Doctor']
    }
  };
  
  // Function to extract doctor type from LLM output
  const extractDoctorType = (llmText) => {
    // Convert text to lowercase for better matching
    const text = llmText.toLowerCase();
    
    // Check for exact matches in main types and alternate names
    for (const [type, info] of Object.entries(doctorTypes)) {
      if (text.includes(type.toLowerCase())) {
        return type;
      }
      
      // Check alternate names
      for (const altName of info.alternateNames) {
        if (text.includes(altName.toLowerCase())) {
          return type;
        }
      }
    }
    
    // Helper function to find closest match using simple string similarity
    const findClosestMatch = (text) => {
      let bestMatch = null;
      let highestSimilarity = 0;
      
      const words = text.split(/\s+/);
      
      for (const [type, info] of Object.entries(doctorTypes)) {
        const allNames = [type, ...info.alternateNames];
        
        for (const name of allNames) {
          for (const word of words) {
            const similarity = calculateSimilarity(word, name.toLowerCase());
            if (similarity > highestSimilarity && similarity > 0.7) {
              highestSimilarity = similarity;
              bestMatch = type;
            }
          }
        }
      }
      
      return bestMatch;
    };
    
    // Basic string similarity calculation (Levenshtein distance based)
    const calculateSimilarity = (str1, str2) => {
      const longer = str1.length > str2.length ? str1 : str2;
      const shorter = str1.length > str2.length ? str2 : str1;
      
      const longerLength = longer.length;
      if (longerLength === 0) return 1.0;
      
      const distance = levenshteinDistance(longer, shorter);
      return (longerLength - distance) / longerLength;
    };
    
    // Levenshtein distance calculation
    const levenshteinDistance = (str1, str2) => {
      const matrix = Array(str2.length + 1).fill().map(() => 
        Array(str1.length + 1).fill(0)
      );
      
      for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
      for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
      
      for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
          const cost = str1[i-1] === str2[j-1] ? 0 : 1;
          matrix[j][i] = Math.min(
            matrix[j-1][i] + 1,
            matrix[j][i-1] + 1,
            matrix[j-1][i-1] + cost
          );
        }
      }
      
      return matrix[str2.length][str1.length];
    };
    
    // Try to find closest match if no exact match found
    return findClosestMatch(text);
  };
  
  // Example usage:
  // const llmResponse = "You should see a heart doctor for your condition";
  // const doctorType = extractDoctorType(llmResponse);
  // console.log(doctorType); // Output: "Cardiologist"  
  export { doctorTypes, extractDoctorType };
