import {CurriculumModule, Lesson} from '../types';

export const CURRICULUM_MODULES: CurriculumModule[] = [
  {
    id: 'mod-basico',
    order: 1,
    level: 'Básico',
    title: '01. Fundamentos e Produtividade',
    description: 'Interface, referências de células, funções essenciais e formatação para organizar planilhas limpas.',
  },
  {
    id: 'mod-intermediario',
    order: 2,
    level: 'Intermediário',
    title: '02. Lógica, Condições e Texto',
    description: 'Decisões automatizadas com SE, agregações condicionais e tratamento de textos e datas.',
  },
  {
    id: 'mod-analise',
    order: 3,
    level: 'Análise',
    title: '03. Cruzamento de Bases e Tabelas Dinâmicas',
    description: 'Domine PROCV, PROCX, ÍNDICE+CORRESP e resumos dinâmicos para análise gerencial.',
  },
  {
    id: 'mod-avancado',
    order: 4,
    level: 'Avançado',
    title: '04. Dashboards, Power Query e Automação',
    description: 'Painéis executivos, tratamento automático de dados (ETL) com Power Query e fundamentos de Macros/VBA.',
  },
];

export const LESSONS: Lesson[] = [
  // MÓDULO 1 — BÁSICO
  {
    id: 'l-01',
    moduleId: 'mod-basico',
    order: 1,
    level: 'Básico',
    title: 'Interface, Células e Primeiros Passos',
    subtitle: 'Navegação rápida, estrutura de pastas de trabalho, tipos de dados e boas práticas iniciais.',
    duration: '2:34:37',
    videoId: 'Eb699OUg4Kk',
    videoTitle: 'Aula Completa de Excel - Aprenda para Começar a Trabalhar',
    channel: 'Hashtag Treinamentos',
    summary:
      'Toda planilha organiza informações em colunas (letras) e linhas (números), formando células como A1 ou C5. Trate cada coluna como um único tipo de dado (texto, número ou data) e evite células mescladas em bases de dados.',
    keyPoints: [
      'Use Ctrl + Setas para saltar rapidamente até a última célula preenchida da tabela.',
      'Converta bases em Tabela Oficial (Ctrl + Alt + T) para expandir fórmulas automaticamente.',
      'Formate valores como Moeda ou Percentual apenas na exibição — nunca digite "R$" manualmente junto ao número.',
    ],
    syntaxes: [
      {pt: '=A1+B1', en: '=A1+B1', meaning: 'Operação aritmética direta entre células'},
      {pt: '=C2*D2', en: '=C2*D2', meaning: 'Multiplicação de quantidade por preço unitário'},
    ],
    pitfall:
      'Mesclar células dentro de tabelas impede ordenação correta, quebra filtros e causa erros em fórmulas de busca e Tabelas Dinâmicas.',
    linkedExerciseId: 'ex-01',
  },
  {
    id: 'l-02',
    moduleId: 'mod-basico',
    order: 2,
    level: 'Básico',
    title: 'Referências Relativas e Absolutas ($)',
    subtitle: 'Aprenda a travar linhas e colunas com F4 para arrastar fórmulas sem quebrar resultados.',
    duration: '6:45',
    videoId: '6SAVMkvNHOI',
    videoTitle: 'Referências relativas e absolutas no Excel',
    channel: 'Dicionário de Informática',
    summary:
      'Por padrão, o Excel desloca referências quando você arrasta uma fórmula (referência relativa). Quando um cálculo depende de uma célula fixa — como uma taxa de imposto, meta ou cotação do dólar — use o cifrão ($) para travar coluna e/ou linha.',
    keyPoints: [
      'A1 é relativa: muda tanto a coluna quanto a linha ao arrastar.',
      '$A$1 é absoluta: permanece fixa em qualquer direção.',
      'A$1 trava apenas a linha; $A1 trava apenas a coluna (referência mista).',
      'Pressione F4 enquanto edita a referência para alternar rapidamente entre os 4 modos.',
    ],
    syntaxes: [
      {pt: '=B2*(1+$E$2)', en: '=B2*(1+$E$2)', meaning: 'Aplica taxa fixa em E2 sobre cada linha de B'},
      {pt: '=B2/$B$10', en: '=B2/$B$10', meaning: 'Calcula participação percentual sobre um total fixo'},
    ],
    pitfall:
      'Esquecer de travar a célula de taxa ou o intervalo de busca faz a segunda linha já multiplicar por uma célula vazia e retornar zero ou #DIV/0!.',
    linkedExerciseId: 'ex-03',
  },
  {
    id: 'l-03',
    moduleId: 'mod-basico',
    order: 3,
    level: 'Básico',
    title: 'Fórmulas Essenciais: SOMA, MÉDIA, MÁXIMO e MÍNIMO',
    subtitle: 'Resuma colunas financeiras e indicadores numéricos em segundos usando intervalos.',
    duration: '9:09',
    videoId: 'xokwgKhcGOo',
    videoTitle: 'Como usar SOMA, MÉDIA, MÍNIMO e MÁXIMO no Excel passo a passo!',
    channel: 'Érika Melo',
    summary:
      'As funções de agregação operam sobre intervalos contínuos indicados por dois-pontos (ex.: B2:B20). Elas ignoram células de texto e células vazias, oferecendo o alicerce para qualquer resumo gerencial.',
    keyPoints: [
      'Alt + = insere AutoSoma automaticamente abaixo ou ao lado de números.',
      'MÉDIA ignora células vazias, mas considera células com o número 0 no denominador.',
      'CONT.NÚM conta apenas números; CONT.VALORES conta qualquer célula preenchida.',
    ],
    syntaxes: [
      {pt: '=SOMA(C2:C6)', en: '=SUM(C2:C6)', meaning: 'Soma todos os valores numéricos no intervalo'},
      {pt: '=MÉDIA(B2:B6)', en: '=AVERAGE(B2:B6)', meaning: 'Calcula a média aritmética'},
      {pt: '=MÁXIMO(B2:B6)', en: '=MAX(B2:B6)', meaning: 'Retorna o maior valor do intervalo'},
      {pt: '=MÍNIMO(B2:B6)', en: '=MIN(B2:B6)', meaning: 'Retorna o menor valor do intervalo'},
    ],
    pitfall:
      'Incluir a própria célula do total dentro do intervalo (ex.: colocar =SOMA(C2:C7) dentro de C7) gera erro de Referência Circular.',
    linkedExerciseId: 'ex-02',
  },
  {
    id: 'l-04',
    moduleId: 'mod-basico',
    order: 4,
    level: 'Básico',
    title: 'Formatação Condicional e Filtros',
    subtitle: 'Destaque desvios, duplicados e metas visualmente sem colorir células à mão.',
    duration: '24:08',
    videoId: 'CmQVDFQ1Wn4',
    videoTitle: 'Formatação Condicional no Excel do Básico ao Avançado',
    channel: 'Hashtag Treinamentos',
    summary:
      'A Formatação Condicional aplica cores, barras de dados ou ícones automaticamente conforme o valor da célula muda. Combinada com Filtros (Ctrl + Shift + L), transforma tabelas extensas em painéis de leitura imediata.',
    keyPoints: [
      'Use "Realçar Regras das Células > Valores Duplicados" para auditar IDs ou CPFs repetidos.',
      'Regras com fórmulas personalizadas exigem referência mista (ex.: =$D2="Atrasado") para colorir a linha inteira.',
      'Use "Gerenciar Regras" para revisar prioridades e evitar regras duplicadas que deixam a planilha lenta.',
    ],
    syntaxes: [
      {pt: '=$C2<0', en: '=$C2<0', meaning: 'Regra condicional para destacar linha com saldo negativo'},
      {pt: '=$E2="Atrasado"', en: '=$E2="Atrasado"', meaning: 'Destaca toda a linha conforme texto da coluna E'},
    ],
    pitfall:
      'Aplicar dezenas de regras em colunas inteiras (A:Z) aumenta o tamanho do arquivo e deixa o recálculo pesado.',
  },

  // MÓDULO 2 — INTERMEDIÁRIO
  {
    id: 'l-05',
    moduleId: 'mod-intermediario',
    order: 5,
    level: 'Intermediário',
    title: 'Função Lógica SE, E, OU',
    subtitle: 'Crie regras de decisão automáticas para aprovações, faixas de bônus e alertas.',
    duration: '12:43',
    videoId: 'FvawWGwRet8',
    videoTitle: 'Como Usar Função SE no Excel em 3 Exemplos Diferentes e Práticos',
    channel: 'Curso de Excel Online',
    summary:
      'A função SE testa uma condição lógica e retorna um resultado quando ela é verdadeira e outro quando é falsa. Combinada com E (todas verdadeiras) ou OU (ao menos uma verdadeira), modela regras de negócio complexas.',
    keyPoints: [
      'Textos dentro de fórmulas devem sempre estar entre aspas duplas: "Aprovado".',
      'Números não levam aspas; colocar "100" transforma o valor em texto e quebra cálculos futuros.',
      'Em múltiplas faixas, prefira a função SES (IFS) no lugar de vários SE aninhados.',
    ],
    syntaxes: [
      {pt: '=SE(C2>=5000;"Bateu";"Abaixo")', en: '=IF(C2>=5000,"Bateu","Abaixo")', meaning: 'Classifica meta batida ou abaixo'},
      {pt: '=SE(E(B2>=7;C2>=75%);"Aprovado";"Revisar")', en: '=IF(AND(B2>=7,C2>=75%),"Aprovado","Revisar")', meaning: 'Exige duas condições simultâneas'},
    ],
    pitfall:
      'No Excel em português, o separador de argumentos é ponto e vírgula (;), enquanto no Excel em inglês é vírgula (,).',
    linkedExerciseId: 'ex-04',
  },
  {
    id: 'l-06',
    moduleId: 'mod-intermediario',
    order: 6,
    level: 'Intermediário',
    title: 'Agregações Condicionais: SOMASE e CONT.SE',
    subtitle: 'Some faturamento e conte ocorrências apenas para categorias ou critérios específicos.',
    duration: '8:32',
    videoId: 'ntoU0-BO7qY',
    videoTitle: 'Fórmula SOMASE - Como SOMAR com CONDIÇÃO no Excel',
    channel: 'Hashtag Treinamentos',
    summary:
      'SOMASE e CONT.SE resumem dados sem precisar filtrar manualmente a tabela. Para múltiplos critérios simultâneos (ex.: região "Sul" E mês "Janeiro"), utilize SOMASES e CONT.SES.',
    keyPoints: [
      'No SOMASE, o intervalo de soma vem por último; no SOMASES, o intervalo de soma é o primeiro argumento.',
      'Você pode usar operadores entre aspas como critério: ">1000", "<>Cancelado" ou curingas como "Camisa*".',
      'Mantenha os intervalos com exatamente o mesmo número de linhas para evitar #VALOR!.',
    ],
    syntaxes: [
      {pt: '=SOMASE(B2:B7;"Sul";C2:C7)', en: '=SUMIF(B2:B7,"Sul",C2:C7)', meaning: 'Soma coluna C onde coluna B for Sul'},
      {pt: '=CONT.SE(C2:C7;"Entregue")', en: '=COUNTIF(C2:C7,"Entregue")', meaning: 'Conta quantos itens têm status Entregue'},
    ],
    pitfall:
      'Inverter a ordem dos argumentos ao migrar de SOMASE para SOMASES é o erro mais comum nessa família de funções.',
    linkedExerciseId: 'ex-05',
  },
  {
    id: 'l-07',
    moduleId: 'mod-intermediario',
    order: 7,
    level: 'Intermediário',
    title: 'Funções de Texto: ESQUERDA, DIREITA e CONCAT',
    subtitle: 'Limpe códigos SKU, separe prefixos e monte chaves padronizadas sem edição manual.',
    duration: '5:47',
    videoId: '5X2XLnUmltg',
    videoTitle: 'Excel - 2.1 Funções de Texto: CONCATENAR, ESQUERDA e DIREITA',
    channel: 'Garcia Treinamentos',
    summary:
      'Bases exportadas de sistemas frequentemente vêm com códigos misturados, espaços extras ou maiúsculas inconsistentes. Funções de texto limpam e padronizam milhares de linhas instantaneamente.',
    keyPoints: [
      'ESQUERDA(texto; n) e DIREITA(texto; n) extraem caracteres fixos das extremidades.',
      'ARRUMAR (TRIM) remove espaços duplicados e espaços invisíveis no início/fim que quebram PROCV.',
      'O operador & ou CONCAT une pedaços de texto com separadores como "-" ou " ".',
    ],
    syntaxes: [
      {pt: '=ESQUERDA(A2;3)', en: '=LEFT(A2,3)', meaning: 'Extrai os 3 primeiros caracteres do código'},
      {pt: '=DIREITA(A2;4)', en: '=RIGHT(A2,4)', meaning: 'Extrai os 4 últimos caracteres'},
      {pt: '=ARRUMAR(A2)', en: '=TRIM(A2)', meaning: 'Remove espaços excedentes'},
    ],
    pitfall:
      'Números extraídos com ESQUERDA ou DIREITA são retornados como texto; multiplique por 1 (ou use VALOR) se precisar somá-los depois.',
    linkedExerciseId: 'ex-07',
  },

  // MÓDULO 3 — BUSCA & ANÁLISE
  {
    id: 'l-08',
    moduleId: 'mod-analise',
    order: 8,
    level: 'Análise',
    title: 'Busca Vertical com PROCV (VLOOKUP)',
    subtitle: 'Cruze tabelas de pedidos, cadastros e preços usando um identificador único.',
    duration: '4:57',
    videoId: 'Ld69Im4QhKQ',
    videoTitle: 'PROCV no Excel - Aprenda a Usar Essa Função em 5 min [=PROCV]',
    channel: 'Hashtag Treinamentos',
    summary:
      'O PROCV procura um valor na primeira coluna de uma matriz e retorna a informação correspondente de uma coluna à direita. É uma das funções mais exigidas em entrevistas e rotinas corporativas.',
    keyPoints: [
      'Sempre informe 0 ou FALSO no último argumento para garantir correspondência exata.',
      'A coluna que contém o valor procurado precisa obrigatoriamente ser a primeira da matriz selecionada.',
      'Combine com SEERRO para substituir #N/D por "Não encontrado" ou 0.',
    ],
    syntaxes: [
      {pt: '=PROCV(E2;A2:C6;3;FALSO)', en: '=VLOOKUP(E2,A2:C6,3,FALSE)', meaning: 'Busca E2 na coluna A e devolve o valor da 3ª coluna (C)'},
    ],
    pitfall:
      'Omitir o 4º argumento faz o Excel assumir correspondência aproximada (VERDADEIRO), retornando valores errados em listas não ordenadas.',
    linkedExerciseId: 'ex-08',
  },
  {
    id: 'l-09',
    moduleId: 'mod-analise',
    order: 9,
    level: 'Análise',
    title: 'Busca Moderna com PROCX (XLOOKUP) e ÍNDICE+CORRESP',
    subtitle: 'Substitua limitações do PROCV buscando para a esquerda, com retorno padrão embutido.',
    duration: '23:47',
    videoId: 'mBITCFW3bF8',
    videoTitle: 'PROCX no Excel - TUDO que você PRECISA SABER da NOVA FUNÇÃO',
    channel: 'Hashtag Treinamentos',
    summary:
      'O PROCX elimina as duas maiores fraquezas do PROCV: não exige que a coluna de busca fique à esquerda e não quebra se você inserir colunas no meio da tabela. Em versões antigas do Excel, a dupla ÍNDICE + CORRESP cumpre o mesmo papel.',
    keyPoints: [
      'PROCX usa correspondência exata por padrão — não precisa digitar FALSO.',
      'O 4º argumento opcional substitui o SEERRO com uma mensagem direta caso não encontre o item.',
      'ÍNDICE(coluna_retorno; CORRESP(valor; coluna_busca; 0)) funciona em qualquer versão do Excel.',
    ],
    syntaxes: [
      {pt: '=PROCX(E2;B2:B6;A2:A6;"Não encontrado")', en: '=XLOOKUP(E2,B2:B6,A2:A6,"Não encontrado")', meaning: 'Procura na coluna B e retorna a coluna A (à esquerda)'},
      {pt: '=ÍNDICE(A2:A6;CORRESP(E2;B2:B6;0))', en: '=INDEX(A2:A6,MATCH(E2,B2:B6,0))', meaning: 'Equivalente universal compatível com versões antigas'},
    ],
    pitfall:
      'No PROCX, a matriz de pesquisa e a matriz de retorno precisam ter exatamente a mesma altura (número de linhas).',
    linkedExerciseId: 'ex-09',
  },
  {
    id: 'l-10',
    moduleId: 'mod-analise',
    order: 10,
    level: 'Análise',
    title: 'Tabelas Dinâmicas e Segmentação de Dados',
    subtitle: 'Resuma milhares de registros em segundos com arrastar e soltar, sem escrever fórmulas.',
    duration: '20:40',
    videoId: '45JpMj8kQDU',
    videoTitle: 'Tabela Dinâmica no Excel do Básico ao Avançado',
    channel: 'Hashtag Treinamentos',
    summary:
      'A Tabela Dinâmica agrupa, soma, conta e compara grandes volumes de dados em instantes. Ao adicionar Segmentação de Dados (Slicers) e Linha do Tempo, você cria filtros clicáveis prontos para reuniões.',
    keyPoints: [
      'A base de origem precisa ter cabeçalhos únicos, sem linhas em branco no meio e sem colunas mescladas.',
      'Use "Mostrar Valores Como > % do Total Geral" para ver participação percentual sem fórmula extra.',
      'Sempre clique em Atualizar Tudo (Ctrl + Alt + F5) após alterar a base de dados.',
    ],
    syntaxes: [
      {pt: 'Inserir > Tabela Dinâmica', en: 'Insert > PivotTable', meaning: 'Atalho principal para resumir bases tabulares'},
      {pt: 'Ctrl + Alt + F5', en: 'Ctrl + Alt + F5', meaning: 'Atualiza todas as Tabelas Dinâmicas e conexões da pasta'},
    ],
    pitfall:
      'Esquecer de atualizar a Tabela Dinâmica após editar a base faz o relatório exibir números desatualizados.',
  },

  // MÓDULO 4 — AVANÇADO & AUTOMAÇÃO
  {
    id: 'l-11',
    moduleId: 'mod-avancado',
    order: 11,
    level: 'Avançado',
    title: 'Dashboards e Proteção de Indicadores (SEERRO)',
    subtitle: 'Estruture 3 camadas (Base, Cálculos, Painel) e blinde KPIs contra erros de divisão.',
    duration: '9:47',
    videoId: 'fFZVqovx3jw',
    videoTitle: 'Como Fazer DASHBOARD Simples em MINUTOS NO EXCEL (Atualizado)',
    channel: 'Curso de Excel Online',
    summary:
      'Um bom Dashboard no Excel separa claramente a aba de Base de Dados, a aba auxiliar de Tabelas Dinâmicas/Cálculos e a aba visual de Apresentação. Cada KPI deve ser protegido com SEERRO para nunca exibir #DIV/0! quando um filtro retornar vazio.',
    keyPoints: [
      'Limite o painel a 4–6 indicadores-chave alinhados em grade limpa.',
      'Conecte uma única Segmentação de Dados a múltiplas Tabelas Dinâmicas via "Conexões de Relatório".',
      'Use SEERRO em todas as divisões de margem, ticket médio e taxa de conversão.',
    ],
    syntaxes: [
      {pt: '=SEERRO((C2-B2)/C2;0)', en: '=IFERROR((C2-B2)/C2,0)', meaning: 'Calcula margem líquida retornando 0 caso receita seja zero'},
    ],
    pitfall:
      'Usar gráficos de pizza com mais de 4 fatias ou excesso de cores saturadas dificulta a leitura executiva; prefira gráficos de barras ordenados.',
    linkedExerciseId: 'ex-10',
  },
  {
    id: 'l-12',
    moduleId: 'mod-avancado',
    order: 12,
    level: 'Avançado',
    title: 'Power Query: Limpeza e ETL Automatizado',
    subtitle: 'Importe CSVs, remova sujeira e transforme relatórios mensais com um único clique em Atualizar.',
    duration: '24:19',
    videoId: '-LJpaUBfjio',
    videoTitle: 'Introdução ao Power Query - Aprenda com um Projeto Completo',
    channel: 'Hashtag Treinamentos',
    summary:
      'O Power Query grava cada etapa de limpeza (remover espaços, dividir colunas, filtrar linhas vazias, transformar colunas em linhas — Unpivot — e empilhar pastas de arquivos CSV) para repetir tudo automaticamente no mês seguinte.',
    keyPoints: [
      'Acesse em Dados > Obter Dados (ou Da Tabela/Intervalo).',
      'Todas as transformações ficam salvas em "Etapas Aplicadas" sem alterar o arquivo original.',
      'Ideal para limpar bases geradas com inconsistências (duplicados, nulos e espaços sobrando).',
    ],
    syntaxes: [
      {pt: 'Dados > Obter Dados > De Arquivo', en: 'Data > Get Data > From File', meaning: 'Conecta CSV, XLSX ou pasta inteira ao Power Query'},
      {pt: 'Transformar > Transformar Colunas em Linhas', en: 'Transform > Unpivot Columns', meaning: 'Normaliza tabelas largas de meses em formato tabular'},
    ],
    pitfall:
      'Renomear colunas diretamente na planilha de destino em vez de dentro do Power Query faz as etapas seguintes falharem na próxima atualização.',
  },
  {
    id: 'l-13',
    moduleId: 'mod-avancado',
    order: 13,
    level: 'Avançado',
    title: 'Introdução a Macros e VBA',
    subtitle: 'Entenda quando gravar Macros, como salvar em .xlsm e a lógica por trás do editor VBA.',
    duration: '9:40',
    videoId: '9LKFVa00MtQ',
    videoTitle: 'O que é VBA? O que são Macros no Excel? (Exemplos e Aplicações Práticas)',
    channel: 'Hashtag Treinamentos',
    summary:
      'Macros automatizam sequências repetitivas de cliques e comandos no Excel gerando código VBA (Visual Basic for Applications). Use quando tarefas exigem interação com a interface, envio de relatórios, exportação de PDFs ou formulários.',
    keyPoints: [
      'Habilite a guia Desenvolvedor em Arquivo > Opções > Personalizar Faixa de Opções.',
      'Pastas com macros devem ser salvas no formato .xlsm (Pasta de Trabalho Habilitada para Macro).',
      'Use Alt + F11 para abrir o editor VBA e inspecionar o código criado pelo Gravador de Macros.',
    ],
    syntaxes: [
      {pt: 'Alt + F11', en: 'Alt + F11', meaning: 'Abre o Editor do Visual Basic (VBA)'},
      {pt: 'Sub RelatorioPDF() ... End Sub', en: 'Sub RelatorioPDF() ... End Sub', meaning: 'Bloco básico de uma sub-rotina VBA'},
    ],
    pitfall:
      'Salvar um arquivo com macros no formato comum .xlsx apaga permanentemente todo o código VBA sem aviso óbvio após fechar.',
  },
];
