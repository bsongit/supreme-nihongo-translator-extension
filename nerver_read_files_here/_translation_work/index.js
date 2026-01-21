const fs = require('fs');
const path = require('path');

async function processarArquivoGrandeJSON(arquivoEntrada, itensPorArquivo = 100) {
  return new Promise((resolve, reject) => {
    console.log(`Processando arquivo grande: ${arquivoEntrada}`);
    
    // Criar stream de leitura
    const stream = fs.createReadStream(arquivoEntrada, { encoding: 'utf8' });
    let buffer = '';
    let itemCount = 0;
    let fileCount = 1;
    let currentGroup = {};
    let insideObject = false;
    let currentKey = '';
    
    // Criar diretório de saída
    const diretorioSaida = './saida_grande';
    if (!fs.existsSync(diretorioSaida)) {
      fs.mkdirSync(diretorioSaida, { recursive: true });
    }
    
    stream.on('data', (chunk) => {
      buffer += chunk;
      processBuffer();
    });
    
    stream.on('end', () => {
      // Salvar último grupo se houver itens
      if (Object.keys(currentGroup).length > 0) {
        saveCurrentGroup();
      }
      console.log(`Processamento concluído! Total: ${itemCount} itens, ${fileCount-1} arquivos`);
      resolve();
    });
    
    stream.on('error', (err) => {
      reject(err);
    });
    
    function processBuffer() {
      let startIdx = 0;
      
      // Procurar por padrões de chaves JSON
      while (true) {
        // Encontrar início de uma chave
        const keyStart = buffer.indexOf('"', startIdx);
        if (keyStart === -1) break;
        
        const keyEnd = buffer.indexOf('"', keyStart + 1);
        if (keyEnd === -1) break;
        
        const key = buffer.substring(keyStart + 1, keyEnd);
        
        // Encontrar o objeto de valor
        const valueStart = buffer.indexOf('{', keyEnd);
        if (valueStart === -1) break;
        
        let depth = 1;
        let valueEnd = valueStart + 1;
        
        while (depth > 0 && valueEnd < buffer.length) {
          if (buffer[valueEnd] === '{') depth++;
          if (buffer[valueEnd] === '}') depth--;
          valueEnd++;
        }
        
        if (depth > 0) break; // Objeto incompleto
        
        const valueStr = buffer.substring(valueStart, valueEnd);
        
        try {
          const valueObj = JSON.parse(valueStr);
          
          // Adicionar ao grupo atual (apenas descrição)
          currentGroup[key] = valueObj.description;
          itemCount++;
          
          // Verificar se precisa criar novo arquivo
          if (Object.keys(currentGroup).length >= itensPorArquivo) {
            saveCurrentGroup();
            currentGroup = {};
            fileCount++;
          }
          
        } catch (err) {
          console.warn(`Erro ao processar item ${key}: ${err.message}`);
        }
        
        startIdx = valueEnd;
      }
      
      // Manter apenas a parte não processada do buffer
      if (startIdx > 0) {
        buffer = buffer.substring(startIdx);
      }
    }
    
    function saveCurrentGroup() {
      if (Object.keys(currentGroup).length === 0) return;
      
      const nomeArquivo = path.join(diretorioSaida, `saida_${fileCount}.json`);
      const conteudo = JSON.stringify(currentGroup, null, 2);
      
      fs.writeFileSync(nomeArquivo, conteudo, 'utf8');
      console.log(`Arquivo criado: ${nomeArquivo} (${Object.keys(currentGroup).length} itens)`);
    }
  });
}

// Uso:
processarArquivoGrandeJSON('./main_dataset.json', 100)
  .then(() => console.log('Concluído!'))
  .catch(console.error);