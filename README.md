# Nihongo Translator & Grammar

**Nihongo Translator & Grammar** é uma extensão de navegador projetada para auxiliar estudantes de japonês através de tradução contextual, análise de kanji e verificação gramatical diretamente nas páginas da web.

## Funcionalidades Principais

*   **Tradução Bidirecional Inteligente**:
    *   **JP → PT**: Traduz palavras e frases do japonês para o português, fornecendo quebra de vocabulário.
    *   **PT → JP**: Busca termos em português e exibe os equivalentes em japonês.
*   **Análise Gramatical (Grammar Scanner)**: Identifica e explica estruturas gramaticais presentes no texto, cobrindo níveis do JLPT N5 ao N1.
*   **Detalhes de Kanji**: Ao selecionar texto japonês, exibe informações detalhadas sobre os caracteres, incluindo:
    *   Leituras (On'yomi e Kun'yomi).
    *   Significados.
    *   Nível JLPT.
    *   Número de traços.
*   **Pronúncia (Text-to-Speech)**: Recurso de áudio integrado para ler o texto em japonês.
*   **Popup Não Intrusivo**: A interface aparece flutuando próxima ao texto selecionado apenas quando a extensão está ativa.

## Instalação

1.  Baixe ou clone este repositório.
2.  Abra seu navegador baseado em Chromium (Chrome, Edge, Brave, etc.).
3.  Acesse a página de extensões (`chrome://extensions` ou `edge://extensions`).
4.  Ative o **Modo do desenvolvedor** (Developer mode) no canto da tela.
5.  Clique no botão **Carregar sem compactação** (Load unpacked).
6.  Selecione a pasta raiz deste projeto (`supreme-nihongo-translator-extension`).

> **Nota**: Certifique-se de que o arquivo `main_dataset_pt.json` esteja presente na pasta, pois ele é essencial para o funcionamento do dicionário.

## Como Usar

1.  **Ativar/Desativar**:
    *   Pressione o atalho **`Ctrl + Alt + V`** para alternar o estado da extensão.
    *   Uma notificação visual aparecerá no canto da tela confirmando se a extensão está "ATIVADA" ou "DESATIVADA".

2.  **Traduzir e Analisar**:
    *   Com a extensão ativada, selecione qualquer texto em uma página da web com o mouse.
    *   O popup surgirá automaticamente exibindo a tradução, gramática e vocabulário.

3.  **Áudio**:
    *   Clique no botão verde **"🔊 Ouvir Pronúncia"** dentro do popup para ouvir o texto selecionado.

## Tecnologias

*   **Manifest V3**: Padrão atual para extensões do Chrome.
*   **JavaScript (ES6+)**: Lógica modularizada em serviços (`DictionaryService`, `JapaneseGrammarScanner`, `JapaneseTextReader`).