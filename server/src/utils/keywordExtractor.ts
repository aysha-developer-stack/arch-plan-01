/**
 * Keyword Extraction Utility for Architectural Plan Descriptions
 * 
 * This utility extracts relevant architectural keywords from natural language descriptions
 * to improve search functionality. It identifies key terms related to:
 * - Room counts (bedrooms, bathrooms, etc.)
 * - Building characteristics (storeys, materials, styles)
 * - Location information
 * - Architectural features
 */

export interface ExtractedKeywords {
  keywords: string[];
  confidence: number; // 0-1 score indicating extraction confidence
}

// Comprehensive architectural keyword dictionaries
const ARCHITECTURAL_TERMS = {
  // Room types and counts
  rooms: {
    patterns: [
      /(?:(\d+)\s*(?:bed|bedroom|br)s?)/gi,
      /(?:(\d+)\s*(?:bath|bathroom|toilet)s?)/gi,
      /(?:(\d+)\s*(?:living|lounge)\s*(?:area|room|space)s?)/gi,
      /(?:(\d+)\s*(?:garage|car)\s*(?:space|bay)s?)/gi,
    ],
    keywords: ['bedroom', 'bathroom', 'toilet', 'living', 'garage', 'kitchen', 'dining', 'study', 'office']
  },
  
  // Building characteristics
  storeys: {
    patterns: [
      /(?:(single|one|1)\s*(?:storey|story|level))/gi,
      /(?:(double|two|2)\s*(?:storey|story|level))/gi,
      /(?:(triple|three|3)\s*(?:storey|story|level))/gi,
      /(?:(\d+)\s*(?:storey|story|level))/gi,
    ],
    mappings: {
      'single': 'single storey',
      'one': 'single storey',
      '1': 'single storey',
      'double': 'double storey',
      'two': 'double storey', 
      '2': 'double storey',
      'triple': 'three storey',
      'three': 'three storey',
      '3': 'three storey'
    }
  },
  
  // Construction materials
  materials: {
    keywords: ['brick', 'timber', 'steel', 'concrete', 'stone', 'cladding', 'hebel', 'weatherboard', 'render', 'glass']
  },
  
  // Architectural styles
  styles: {
    keywords: ['modern', 'contemporary', 'traditional', 'colonial', 'victorian', 'federation', 'art deco', 'minimalist', 'industrial', 'hamptons', 'mediterranean']
  },
  
  // House types
  houseTypes: {
    keywords: ['house', 'home', 'dwelling', 'residence', 'villa', 'cottage', 'mansion', 'duplex', 'townhouse', 'apartment', 'unit']
  },
  
  // Features and amenities
  features: {
    keywords: ['pool', 'spa', 'deck', 'balcony', 'patio', 'garden', 'courtyard', 'fireplace', 'ensuite', 'walk-in', 'robe', 'pantry', 'laundry']
  },
  
  // Location indicators (Australian cities and regions)
  locations: {
    keywords: ['sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'darwin', 'hobart', 'canberra', 'gold coast', 'sunshine coast', 'newcastle', 'wollongong']
  }
};

/**
 * Extracts keywords from a plan description using pattern matching and keyword recognition
 * @param description The natural language description of the architectural plan
 * @returns ExtractedKeywords object containing keywords and confidence score
 */
export function extractKeywordsFromDescription(description: string): ExtractedKeywords {
  if (!description || typeof description !== 'string') {
    return { keywords: [], confidence: 0 };
  }
  
  const extractedKeywords = new Set<string>();
  const normalizedDescription = description.toLowerCase().trim();
  let totalMatches = 0;
  let possibleMatches = 0;
  
  // Extract room counts and types
  ARCHITECTURAL_TERMS.rooms.patterns.forEach(pattern => {
    const matches = normalizedDescription.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleanMatch = match.replace(/\d+\s*/, '').trim();
        if (cleanMatch.includes('bed')) {
          const count = match.match(/\d+/)?.[0];
          if (count) {
            extractedKeywords.add(`${count} bedroom`);
            totalMatches++;
          }
        } else if (cleanMatch.includes('bath') || cleanMatch.includes('toilet')) {
          const count = match.match(/\d+/)?.[0];
          if (count) {
            extractedKeywords.add(`${count} bathroom`);
            totalMatches++;
          }
        } else if (cleanMatch.includes('living') || cleanMatch.includes('lounge')) {
          const count = match.match(/\d+/)?.[0];
          if (count) {
            extractedKeywords.add(`${count} living area`);
            totalMatches++;
          }
        } else if (cleanMatch.includes('garage') || cleanMatch.includes('car')) {
          const count = match.match(/\d+/)?.[0];
          if (count) {
            extractedKeywords.add(`${count} car garage`);
            totalMatches++;
          }
        }
      });
    }
    possibleMatches++;
  });
  
  // Extract storey information
  ARCHITECTURAL_TERMS.storeys.patterns.forEach(pattern => {
    const matches = normalizedDescription.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const storeyInfo = match.toLowerCase();
        for (const [key, value] of Object.entries(ARCHITECTURAL_TERMS.storeys.mappings)) {
          if (storeyInfo.includes(key)) {
            extractedKeywords.add(value);
            totalMatches++;
            break;
          }
        }
      });
    }
    possibleMatches++;
  });
  
  // Extract materials
  ARCHITECTURAL_TERMS.materials.keywords.forEach(material => {
    if (normalizedDescription.includes(material)) {
      extractedKeywords.add(material);
      totalMatches++;
    }
    possibleMatches++;
  });
  
  // Extract architectural styles
  ARCHITECTURAL_TERMS.styles.keywords.forEach(style => {
    if (normalizedDescription.includes(style)) {
      extractedKeywords.add(style);
      totalMatches++;
    }
    possibleMatches++;
  });
  
  // Extract house types
  ARCHITECTURAL_TERMS.houseTypes.keywords.forEach(type => {
    if (normalizedDescription.includes(type)) {
      extractedKeywords.add(type);
      totalMatches++;
    }
    possibleMatches++;
  });
  
  // Extract features
  ARCHITECTURAL_TERMS.features.keywords.forEach(feature => {
    if (normalizedDescription.includes(feature)) {
      extractedKeywords.add(feature);
      totalMatches++;
    }
    possibleMatches++;
  });
  
  // Extract locations
  ARCHITECTURAL_TERMS.locations.keywords.forEach(location => {
    if (normalizedDescription.includes(location)) {
      extractedKeywords.add(location);
      totalMatches++;
    }
    possibleMatches++;
  });
  
  // Calculate confidence based on matches found vs possible matches
  const confidence = possibleMatches > 0 ? Math.min(totalMatches / (possibleMatches * 0.1), 1) : 0;
  
  return {
    keywords: Array.from(extractedKeywords).sort(),
    confidence: Math.round(confidence * 100) / 100
  };
}

/**
 * Test function to demonstrate keyword extraction
 * @param description Test description
 */
export function testKeywordExtraction(description: string): void {
  console.log(`\n🔍 Testing keyword extraction for: "${description}"`);
  const result = extractKeywordsFromDescription(description);
  console.log(`📝 Extracted keywords: ${result.keywords.join(', ')}`);
  console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
}

// Example usage and test cases
if (import.meta.url === `file://${process.argv[1]}`) {
  // Test with the user's example
  testKeywordExtraction("This is a modern double storey 3 bedroom house in Sydney with brick walls");
  
  // Additional test cases
  testKeywordExtraction("Contemporary single storey 4 bedroom 2 bathroom home with timber cladding and pool");
  testKeywordExtraction("Traditional brick veneer 2 storey family home with 3 bedrooms, 2 bathrooms, and double garage in Melbourne");
  testKeywordExtraction("Luxury waterfront villa with 5 bedrooms, 4 bathrooms, stone features, and panoramic views");
}