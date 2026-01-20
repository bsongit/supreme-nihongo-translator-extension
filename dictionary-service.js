class DictionaryService {
    constructor(dataset) {
        this.dataset = dataset;
    }

    /**
     * Detects if text is likely Japanese (contains Kana or Kanji)
     */
    isJapanese(text) {
        // Regex range for Hiragana, Katakana, and CJK Unified Ideographs
        const jpRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
        return jpRegex.test(text);
    }

    /**
     * Translates/Looks up Japanese text to Portuguese
     * Returns an object with the breakdown of characters found
     */
    translateToPT(text) {
        const results = {
            original: text,
            translated: [], // List of potential meanings found
            kanjiBreakdown: []
        };

        // 1. Try to find the whole word/phrase first
        if (this.dataset[text]) {
            const entry = { ...this.dataset[text], char: text };
            results.translated.push(this.formatEntryMeaning(entry));
            results.kanjiBreakdown.push(entry);
        } else {
            // 2. Iterate through characters to find individual Kanjis/Words
            // Note: A simple char iteration. For better results, a tokenizer (like Kuromoji) is recommended.
            for (const char of text) {
                if (this.dataset[char]) {
                    const entry = { ...this.dataset[char], char: char };
                    results.kanjiBreakdown.push(entry);
                    
                    // Add primary meaning to translation list if not too cluttered
                    if (entry.description) {
                        results.translated.push(`${char}: ${entry.description}`);
                    }
                }
            }
        }

        if (results.translated.length === 0) {
            results.translated.push("Tradução direta não encontrada no dicionário.");
        }

        return results;
    }

    /**
     * Translates/Looks up Portuguese text to Japanese
     * Performs a reverse search in the dataset
     */
    translateToJP(text) {
        const searchTerms = text.toLowerCase().split(' ').filter(t => t.length > 0);
        const matches = [];

        // Iterate over the entire dataset to find matches in meanings or ptbr fields
        // Note: This can be slow for very large datasets. Indexing is recommended for production.
        for (const [key, entry] of Object.entries(this.dataset)) {
            let score = 0;
            
            // Check description field
            if (entry.description && typeof entry.description === 'string') {
                if (entry.description.toLowerCase() === text.toLowerCase()) score += 10; // Exact match
                else if (entry.description.toLowerCase().includes(text.toLowerCase())) score += 5;
            }

            if (score > 0) {
                matches.push({ key, entry: { ...entry, char: key }, score });
            }
        }

        // Sort by relevance
        matches.sort((a, b) => b.score - a.score);

        // Take top 3 matches
        const topMatches = matches.slice(0, 3);

        return {
            original: text,
            // The "translated" text is the Japanese Key of the best match
            translatedText: topMatches.length > 0 ? topMatches[0].key : "???",
            matches: topMatches.map(m => m.entry)
        };
    }

    formatEntryMeaning(entry) {
        if (entry.description) return entry.description;
        return "Sem definição";
    }
}

// Export for Node.js or attach to window for Browser
if (typeof window !== 'undefined') {
    window.DictionaryService = DictionaryService;
}
