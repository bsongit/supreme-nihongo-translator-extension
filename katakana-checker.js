class KatakanaChecker {
    constructor() {
        // Mapeamento básico de Katakana para Romaji
        this.basicMap = {
            'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
            'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
            'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
            'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
            'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
            'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
            'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
            'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
            'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
            'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n',
            'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
            'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
            'ダ': 'da', 'ヂ': 'ji', 'ヅ': 'zu', 'デ': 'de', 'ド': 'do',
            'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
            'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po',
            'ヴ': 'vu'
        };
        
        // Combinações (Yoon e outros sons compostos)
        this.combinations = {
            'キャ': 'kya', 'キュ': 'kyu', 'キョ': 'kyo',
            'シャ': 'sha', 'シュ': 'shu', 'ショ': 'sho',
            'チャ': 'cha', 'チュ': 'chu', 'チョ': 'cho',
            'ニャ': 'nya', 'ニュ': 'nyu', 'ニョ': 'nyo',
            'ヒャ': 'hya', 'ヒュ': 'hyu', 'ヒョ': 'hyo',
            'ミャ': 'mya', 'ミュ': 'myu', 'ミョ': 'myo',
            'リャ': 'rya', 'リュ': 'ryu', 'リョ': 'ryo',
            'ギャ': 'gya', 'ギュ': 'gyu', 'ギョ': 'gyo',
            'ジャ': 'ja', 'ジュ': 'ju', 'ジョ': 'jo',
            'ビャ': 'bya', 'ビュ': 'byu', 'ビョ': 'byo',
            'ピャ': 'pya', 'ピュ': 'pyu', 'ピョ': 'pyo',
            'シェ': 'she', 'チェ': 'che', 'ツァ': 'tsa', 'ツェ': 'tse', 'ツォ': 'tso',
            'ティ': 'ti', 'ディ': 'di', 'デュ': 'dyu', 'ファ': 'fa', 'フィ': 'fi', 'フェ': 'fe', 'フォ': 'fo',
            'ウィ': 'wi', 'ウェ': 'we', 'ウォ': 'wo', 'ヴァ': 'va', 'ヴィ': 'vi', 'ヴェ': 've', 'ヴォ': 'vo'
        };
    }

    // Converte texto Katakana para Romaji
    toRomaji(text) {
        let romaji = '';
        let i = 0;
        while (i < text.length) {
            // Verifica combinações de 2 caracteres primeiro
            if (i + 1 < text.length) {
                const twoChars = text.substring(i, i + 2);
                if (this.combinations[twoChars]) {
                    romaji += this.combinations[twoChars];
                    i += 2;
                    continue;
                }
            }
            
            const char = text[i];
            
            // Sokuon (Pequeno Tsu) - duplica a próxima consoante
            if (char === 'ッ') {
                if (i + 1 < text.length) {
                    let nextConsonant = '';
                    // Verifica se o próximo é uma combinação
                    if (i + 2 < text.length) {
                        const nextTwo = text.substring(i + 1, i + 3);
                        if (this.combinations[nextTwo]) {
                            nextConsonant = this.combinations[nextTwo].charAt(0);
                        }
                    }
                    // Se não for combinação, pega do mapa básico
                    if (!nextConsonant) {
                        const nextChar = text[i + 1];
                        const nextRomaji = this.basicMap[nextChar];
                        if (nextRomaji) nextConsonant = nextRomaji.charAt(0);
                    }
                    
                    if (nextConsonant) romaji += nextConsonant;
                }
                i++;
                continue;
            }
            
            // Vogal longa
            if (char === 'ー') {
                romaji += '-';
                i++;
                continue;
            }
            
            // Caractere simples
            romaji += this.basicMap[char] || char;
            i++;
        }
        return romaji;
    }

    // Escaneia o texto e retorna palavras em Katakana com seus equivalentes
    scan(text) {
        const results = [];
        // Regex para capturar blocos de Katakana (incluindo vogal longa)
        const regex = /[\u30A0-\u30FF]+(?:ー[\u30A0-\u30FF]*)*|[\u30A0-\u30FF]+/g;
        
        let match;
        while ((match = regex.exec(text)) !== null) {
            const word = match[0];
            // Ignora se for apenas pontuação katakana isolada (raro, mas possível)
            if (word === '・' || word === 'ー') continue;

            results.push({
                text: word,
                romaji: this.toRomaji(word),
                position: match.index
            });
        }
        return results;
    }
}

// Exporta para uso no navegador
if (typeof window !== 'undefined') {
    window.KatakanaChecker = KatakanaChecker;
}