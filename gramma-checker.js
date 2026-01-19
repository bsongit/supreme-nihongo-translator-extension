class JapaneseGrammarScanner {
    constructor() {
        this.patterns = this.parseGrammarPatterns();
    }

    // Analisa o arquivo de estruturas e cria padrões de busca
    parseGrammarPatterns() {
        // Dados das estruturas (aqui você poderia carregar de um arquivo)
        // Para simplificar, vou incluir as estruturas principais
        return [
            // N5
                  // N5 - Ajustado para evitar falsos positivos
            { pattern: /(?<!で)は(?!です|した)/g, level: "N5", description: "Particula 'wa', marca o tópico da frase" },
            { pattern: /(?<!で)が(?!あります|ありません)/g, level: "N5", description: "Partícula 'ga', Indica o sujeito da frase, especialmente para dar ênfase, introduzir novas informações ou com verbos de habilidade/afinidade. Também pode indicar 'mas' quando está no final de uma frase." },
            { pattern: /(?<!で)を(?!の)/g, level: "N5", description: "Partícula 'wo', Indica o objeto direto de um verbo transitivo. Na fala moderna, pronuncia-se 'o', e não 'wo'." },
            { pattern: /(?<!で)も(?!の|う)/g, level: "N5", description: "Partícula 'mo', Indica também'" },
            { pattern: /(?<!で)に(?!は|も|の|します)/g, level: "N5", description: "Partícula de tempo/destino" },
            { pattern: /(?<!で)で(?![すしょ])/g, level: "N5", description: "Partícula de local/instrumento" },
            { pattern: /(?<!で)へ(?!の)/g, level: "N5", description: "Partícula de direção" },
            { pattern: /(?<!で)と(?!いう|思う)/g, level: "N5", description: "Partícula 'e' ou 'com'" },
            { pattern: /(?<!で)や(?!く)/g, level: "N5", description: "Partícula 'e' (lista não exaustiva)" },
            { pattern: /(?<!で)の(?![ばりき])/g, level: "N5", description: "Partícula de posse" },
            { pattern: /から(?![のと])/g, level: "N5", description: "Partícula 'de' ou 'porque'" },
            { pattern: /(?<!でし)まで(?![のと])/g, level: "N5", description: "Partícula 'até'" },
            
            // Padrões mais complexos com prioridade alta (para evitar falsos positivos)
            { pattern: /てください(?![ょ])/g, level: "N5", description: "Pedido polido" },
            { pattern: /ています(?![ょ])/g, level: "N5", description: "Ação contínua" },
            { pattern: /てはいけません/g, level: "N5", description: "Proibição" },
            { pattern: /てもいいです/g, level: "N5", description: "Permissão" },
            { pattern: /たことがある/g, level: "N5", description: "Experiência passada" },
            { pattern: /ないでください/g, level: "N5", description: "Pedido negativo" },
            { pattern: /(?<!で)ながら(?!の)/g, level: "N5", description: "Ação simultânea" },
            { pattern: /(?<!でし)たい(?!い)/g, level: "N5", description: "Querer fazer" },
            { pattern: /たくない(?!い)/g, level: "N5", description: "Não querer fazer" },
            { pattern: /まえに(?!は)/g, level: "N5", description: "Antes de" },
            { pattern: /あとで(?!は)/g, level: "N5", description: "Depois de" },
            { pattern: /(?<!でし)とき(?!は)/g, level: "N5", description: "Quando" },
            
            // Adiciona padrões para capturar expressões completas primeiro
            { pattern: /です(?!て)/g, level: "N5", description: "Verbo ser/estar polido" },
            { pattern: /ます(?!て)/g, level: "N5", description: "Finalizador polido para verbos" },
            { pattern: /でしょう(?!う)/g, level: "N4", description: "Provavelmente" },
            { pattern: /でした(?!た)/g, level: "N5", description: "Passado de 'desu'" },
            { pattern: /ません(?!か)/g, level: "N5", description: "Negativo polido" },
            
            // N4 - Com ajustes similares
            { pattern: /てみる(?!る)/g, level: "N4", description: "Tentar fazer" },
            { pattern: /てしまう(?!う)/g, level: "N4", description: "Ação completa/arrependimento" },
            { pattern: /ておく(?!く)/g, level: "N4", description: "Fazer antecipadamente" },
            { pattern: /てくる(?!る)/g, level: "N4", description: "Ação que se aproxima" },
            { pattern: /ていく(?!く)/g, level: "N4", description: "Ação que se distancia" },
            { pattern: /なければならない/g, level: "N4", description: "Ter que fazer" },
            { pattern: /なくてもいい/g, level: "N4", description: "Não precisa fazer" },
            { pattern: /ことができる/g, level: "N4", description: "Poder/conseguir fazer" },
            { pattern: /ことにする/g, level: "N4", description: "Decidir fazer" },
            { pattern: /ことになる/g, level: "N4", description: "Foi decidido que" },
            { pattern: /ために/g, level: "N4", description: "Para/Devido a" },
            { pattern: /ように/g, level: "N4", description: "A fim de que" },
            { pattern: /ようになる/g, level: "N4", description: "Tornar-se capaz de" },
            { pattern: /ようにする/g, level: "N4", description: "Esforçar-se para" },
            { pattern: /かもしれない/g, level: "N4", description: "Talvez" },
            { pattern: /すぎる/g, level: "N4", description: "Excesso/demais" },
            { pattern: /やすい/g, level: "N4", description: "Fácil de fazer" },
            { pattern: /にくい/g, level: "N4", description: "Difícil de fazer" },
            { pattern: /ばかり/g, level: "N4", description: "Só faz isso" },
            { pattern: /だけ/g, level: "N4", description: "Apenas/somente" },
            { pattern: /しか.*ない/g, level: "N4", description: "Nada além de" },
            { pattern: /のに/g, level: "N4", description: "Apesar de" },
            { pattern: /ので/g, level: "N4", description: "Porque (formal)" },
            { pattern: /し/g, level: "N4", description: "E também" },
            { pattern: /そうだ/g, level: "N4", description: "Ouvi dizer que/Parece que" },
            { pattern: /ようです/g, level: "N4", description: "Parece que (subjetivo)" },
            { pattern: /らしい/g, level: "N4", description: "Parece que (baseado em informação)" },
            
            // N3
            { pattern: /うちに/g, level: "N3", description: "Enquanto (antes que mude)" },
            { pattern: /おかげで/g, level: "N3", description: "Graças a" },
            { pattern: /せいで/g, level: "N3", description: "Por culpa de" },
            { pattern: /かわりに/g, level: "N3", description: "Em vez de/Em troca de" },
            { pattern: /くらい|ぐらい/g, level: "N3", description: "Aproximadamente/A ponto de" },
            { pattern: /最中に/g, level: "N3", description: "No meio de" },
            { pattern: /さえ/g, level: "N3", description: "Até mesmo" },
            { pattern: /という/g, level: "N3", description: "Significa que/Ouvi dizer que" },
            { pattern: /といえば/g, level: "N3", description: "Falando em..." },
            { pattern: /としたら/g, level: "N3", description: "Se supormos que" },
            { pattern: /なんか|なんて/g, level: "N3", description: "Coisas como (desprezo)" },
            { pattern: /に決まっている/g, level: "N3", description: "Com certeza é" },
            { pattern: /に比べて/g, level: "N3", description: "Comparado com" },
            { pattern: /に対して/g, level: "N3", description: "Em relação a" },
            { pattern: /について/g, level: "N3", description: "Sobre (assunto)" },
            { pattern: /によって/g, level: "N3", description: "Por/Dependendo de" },
            { pattern: /ば.*ほど/g, level: "N3", description: "Quanto mais... mais..." },
            { pattern: /べき/g, level: "N3", description: "Deve (obrigação moral)" },
            { pattern: /まるで/g, level: "N3", description: "Como se fosse" },
            { pattern: /みたい/g, level: "N3", description: "Parece (coloquial)" },
            { pattern: /向け/g, level: "N3", description: "Destinado a" },
            { pattern: /向き/g, level: "N3", description: "Adequado para" },
            { pattern: /わけがない/g, level: "N3", description: "Impossível" },
            { pattern: /わけにはいかない/g, level: "N3", description: "Não posso fazer" },
            { pattern: /切る/g, level: "N3", description: "Fazer completamente" },
            { pattern: /かける/g, level: "N3", description: "Estar no meio de" },
            { pattern: /だす/g, level: "N3", description: "Começar de repente" },
            { pattern: /つもりだ/g, level: "N3", description: "Crença de que é" },
            { pattern: /てほしい/g, level: "N3", description: "Quero que você faça" },
            { pattern: /だらけ/g, level: "N3", description: "Cheio de (negativo)" },
            
            // N2
            { pattern: /あげく/g, level: "N2", description: "Depois de muito (resultado ruim)" },
            { pattern: /あまり/g, level: "N2", description: "Tão... que (excesso)" },
            { pattern: /以上/g, level: "N2", description: "Já que/Visto que" },
            { pattern: /一方だ/g, level: "N2", description: "Só faz aumentar/diminuir" },
            { pattern: /うえに/g, level: "N2", description: "Além de" },
            { pattern: /おそれがある/g, level: "N2", description: "Há o receio/risco de" },
            { pattern: /がち/g, level: "N2", description: "Tende a (negativo)" },
            { pattern: /かねない/g, level: "N2", description: "Pode acontecer (ruim)" },
            { pattern: /かねる/g, level: "N2", description: "Não poder/Ser difícil de fazer" },
            { pattern: /からには/g, level: "N2", description: "Já que (determinação forte)" },
            { pattern: /くせに/g, level: "N2", description: "Embora (crítica)" },
            { pattern: /こそ/g, level: "N2", description: "Ênfase (é exatamente isso)" },
            { pattern: /ことか/g, level: "N2", description: "Quão...! (emoção)" },
            { pattern: /ざるを得ない/g, level: "N2", description: "Não ter escolha senão fazer" },
            { pattern: /次第/g, level: "N2", description: "Assim que/Dependendo de" },
            { pattern: /ずにはいられない/g, level: "N2", description: "Não conseguir evitar fazer" },
            { pattern: /だけあって/g, level: "N2", description: "Como esperado de" },
            { pattern: /たとたん/g, level: "N2", description: "No momento em que (surpresa)" },
            { pattern: /たび/g, level: "N2", description: "Toda vez que" },
            { pattern: /て以来/g, level: "N2", description: "Desde que" },
            { pattern: /てしょうがない/g, level: "N2", description: "Extremamente/Insuportavelmente" },
            { pattern: /どころか/g, level: "N2", description: "Longe de ser (é o oposto)" },
            { pattern: /に限り/g, level: "N2", description: "Limitado a/Apenas para" },
            { pattern: /にこたえて/g, level: "N2", description: "Em resposta a" },
            { pattern: /にすぎない/g, level: "N2", description: "Não passa de" },
            { pattern: /に相違ない/g, level: "N2", description: "Sem dúvida é (formal)" },
            { pattern: /に沿って/g, level: "N2", description: "Seguindo/De acordo com" },
            { pattern: /につれて/g, level: "N2", description: "À medida que" },
            { pattern: /にわたって/g, level: "N2", description: "Ao longo de" },
            { pattern: /ぬきで/g, level: "N2", description: "Sem (omitindo algo)" },
            { pattern: /反面/g, level: "N2", description: "Por outro lado" },
            { pattern: /まい/g, level: "N2", description: "Provavelmente não/Intenção de não fazer" },
            { pattern: /ものか/g, level: "N2", description: "De jeito nenhum! (negação forte)" },
            { pattern: /ものだ/g, level: "N2", description: "É natural que/Costumava" },
            { pattern: /ようがない/g, level: "N2", description: "Não há como (método)" },
            { pattern: /わけだ/g, level: "N2", description: "É por isso que/Conclusão lógica" },
            { pattern: /をきっかけに/g, level: "N2", description: "Tendo como gatilho" },
            { pattern: /を通じて/g, level: "N2", description: "Através de/ Durante todo" },
            { pattern: /を問わず/g, level: "N2", description: "Independente de/Sem questionar" },
            
            // N1
            { pattern: /あっての/g, level: "N1", description: "Que existe graças a" },
            { pattern: /いかんだ/g, level: "N1", description: "Depende de" },
            { pattern: /うが|うと/g, level: "N1", description: "Mesmo que (não importa)" },
            { pattern: /かぎりだ/g, level: "N1", description: "Extremo de (emoção)" },
            { pattern: /が最後/g, level: "N1", description: "Uma vez que acontece (acabou)" },
            { pattern: /かたがた/g, level: "N1", description: "Enquanto faz X (com propósito Y)" },
            { pattern: /がてら/g, level: "N1", description: "Aproveitando a oportunidade" },
            { pattern: /が早いか/g, level: "N1", description: "No instante em que" },
            { pattern: /極まる/g, level: "N1", description: "Extremamente (negativo)" },
            { pattern: /ごとき/g, level: "N1", description: "Como/Do tipo de (depreciativo)" },
            { pattern: /ことなしに/g, level: "N1", description: "Sem fazer" },
            { pattern: /始末だ/g, level: "N1", description: "Acabou resultando em (mau estado)" },
            { pattern: /ずくめ/g, level: "N1", description: "Coberto de/Só tem" },
            { pattern: /すら/g, level: "N1", description: "Até mesmo (ênfase extrema)" },
            { pattern: /そばから/g, level: "N1", description: "Mal acabou de fazer e já" },
            { pattern: /ただ.*のみ/g, level: "N1", description: "Apenas/Único" },
            { pattern: /たところで/g, level: "N1", description: "Mesmo que faça (inútil)" },
            { pattern: /だに/g, level: "N1", description: "Só de (já é X)" },
            { pattern: /たる/g, level: "N1", description: "Na qualidade de/Como (posição)" },
            { pattern: /てはいられない/g, level: "N1", description: "Não posso ficar (fazendo X)" },
            { pattern: /といえども/g, level: "N1", description: "Mesmo sendo" },
            { pattern: /と思いきや/g, level: "N1", description: "Pensei que fosse, mas (surpresa)" },
            { pattern: /とは/g, level: "N1", description: "Expressa surpresa/choque" },
            { pattern: /ないものでもない/g, level: "N1", description: "Não é impossível que/Talvez" },
            { pattern: /ながらに/g, level: "N1", description: "Enquanto permanece no estado" },
            { pattern: /なくしては/g, level: "N1", description: "Sem X, não é possível Y" },
            { pattern: /なり/g, level: "N1", description: "Assim que" },
            { pattern: /にはあたらない/g, level: "N1", description: "Não vale a pena/Não é necessário" },
            { pattern: /にかたくない/g, level: "N1", description: "Não é difícil de (imaginar)" },
            { pattern: /にして/g, level: "N1", description: "Sendo X (ênfase em nível/tempo)" },
            { pattern: /に即して/g, level: "N1", description: "Em conformidade com" },
            { pattern: /にたえる/g, level: "N1", description: "Vale a pena/Suporta" },
            { pattern: /の至り/g, level: "N1", description: "O ápice de" },
            { pattern: /はおろか/g, level: "N1", description: "Nem se fala em X (que dirá Y)" },
            { pattern: /ばこそ/g, level: "N1", description: "Justamente porque" },
            { pattern: /まじき/g, level: "N1", description: "Inaceitável para (posição)" },
            { pattern: /までだ/g, level: "N1", description: "Apenas isso e nada mais" },
            { pattern: /もさることながら/g, level: "N1", description: "Não apenas X, mas também Y" },
            { pattern: /ものを/g, level: "N1", description: "Deveria ter feito, mas (lamento)" },
            { pattern: /ゆえに/g, level: "N1", description: "Devido a (formal)" },
            { pattern: /をおいて/g, level: "N1", description: "Exceto X (não há outro)" },
            { pattern: /を禁じ得ない/g, level: "N1", description: "Não conseguir conter (emoção)" },
            { pattern: /をもって/g, level: "N1", description: "Por meio de/Com (formal)" },
            { pattern: /を余儀なくされる/g, level: "N1", description: "Ser forçado a (circunstâncias)" },
            { pattern: /んがため/g, level: "N1", description: "Com o fim de (propósito forte)" }
        ];
    }

       // Versão otimizada que evita duplicatas e falsos positivos
    scanTextOptimized(text) {
        const results = [];
        const matchedPositions = new Set();
        
        // Primeiro, busca por padrões complexos (mais longos primeiro)
        const sortedPatterns = [...this.patterns].sort((a, b) => {
            // Ordena por comprimento do padrão (mais longo primeiro)
            const aLength = a.pattern.source.replace(/[\[\]\(\)\|\?\!\.\*\+\{\}\^\\]/g, '').length;
            const bLength = b.pattern.source.replace(/[\[\]\(\)\|\?\!\.\*\+\{\}\^\\]/g, '').length;
            return bLength - aLength;
        });
        
        for (const patternInfo of sortedPatterns) {
            // Reseta o lastIndex para cada padrão
            patternInfo.pattern.lastIndex = 0;
            
            let match;
            while ((match = patternInfo.pattern.exec(text)) !== null) {
                const startPos = match.index;
                const endPos = startPos + match[0].length;
                
                // Verifica se esta posição já foi capturada por outro padrão
                let positionAlreadyMatched = false;
                for (let i = startPos; i < endPos; i++) {
                    if (matchedPositions.has(i)) {
                        positionAlreadyMatched = true;
                        break;
                    }
                }
                
                if (!positionAlreadyMatched) {
                    // Marca todas as posições como capturadas
                    for (let i = startPos; i < endPos; i++) {
                        matchedPositions.add(i);
                    }
                    
                    // Extrai contexto
                    const contextStart = Math.max(0, startPos - 15);
                    const contextEnd = Math.min(text.length, endPos + 15);
                    const context = text.substring(contextStart, contextEnd);
                    
                    results.push({
                        text: match[0],
                        level: patternInfo.level,
                        description: patternInfo.description,
                        position: startPos,
                        endPosition: endPos,
                        context: context,
                        pattern: patternInfo.pattern.source
                    });
                }
            }
        }
        
        // Ordena por posição no texto
        results.sort((a, b) => a.position - b.position);
        
        return results;
    }

    // Função para exibir resultados
    displayResults(text) {
        const results = this.scanTextOptimized(text);
        
        console.log(`Texto analisado: "${text}"`);
        console.log(`\nTotal de estruturas encontradas: ${results.length}\n`);
        
        if (results.length === 0) {
            console.log("Nenhuma estrutura gramatical identificada.");
            return results;
        }
        
        // Agrupa por nível
        const groupedByLevel = {};
        results.forEach(result => {
            if (!groupedByLevel[result.level]) {
                groupedByLevel[result.level] = [];
            }
            groupedByLevel[result.level].push(result);
        });
        
        // Exibe por nível
        const levels = ["N5", "N4", "N3", "N2", "N1"];
        levels.forEach(level => {
            if (groupedByLevel[level]) {
                console.log(`=== ${level} (${groupedByLevel[level].length}) ===`);
                groupedByLevel[level].forEach(result => {
                    console.log(`• "${result.text}" - ${result.description}`);
                    console.log(`  Posição: ${result.position}-${result.endPosition}`);
                    console.log(`  Contexto: ...${result.context}...\n`);
                });
            }
        });
        
        return results;
    }
}

// Exemplo de uso
function exemploUso() {
    const scanner = new JapaneseGrammarScanner();
    
    // Texto de exemplo em japonês
    const exemploTexto = "私の名前はヨーコです";
    
    console.log("=== EXEMPLO DE USO ===\n");
    const resultados = scanner.displayResults(exemploTexto);
    
    // Também pode retornar os dados para uso programático
    return resultados;
}

// Para uso em navegador ou Node.js
if (typeof window !== 'undefined') {
    window.JapaneseGrammarScanner = JapaneseGrammarScanner;
    window.exemploUso = exemploUso;
} else {
    // Executa o exemplo se rodando em Node.js
    exemploUso();
}