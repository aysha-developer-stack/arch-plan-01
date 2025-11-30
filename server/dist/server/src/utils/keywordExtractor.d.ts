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
    confidence: number;
}
/**
 * Extracts keywords from a plan description using pattern matching and keyword recognition
 * @param description The natural language description of the architectural plan
 * @returns ExtractedKeywords object containing keywords and confidence score
 */
export declare function extractKeywordsFromDescription(description: string): ExtractedKeywords;
/**
 * Test function to demonstrate keyword extraction
 * @param description Test description
 */
export declare function testKeywordExtraction(description: string): void;
//# sourceMappingURL=keywordExtractor.d.ts.map