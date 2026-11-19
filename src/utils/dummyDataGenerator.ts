export type ScenarioId = 'vendas' | 'rh' | 'financeiro' | 'estoque' | 'suporte';

export interface ScenarioDefinition {
  id: ScenarioId;
  name: string;
  subtitle: string;
  columns: string[];
  numericColumns: string[];
  missions: string[];
}

export interface GeneratedDataset {
  scenario: ScenarioDefinition;
  rows: Record<string, string | number>[];
  dirtyInjected: boolean;
  seed: number;
}

export const DATA_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'vendas',
    name: 'Vendas E-commerce & Varejo',
    subtitle: 'Pedidos por região, vendedor, categoria, desconto e faturamento líquido.',
    columns: ['ID_Pedido', 'Data', 'Regiao', 'UF', 'Vendedor', 'Categoria', 'Produto', 'Qtd', 'Preco_Unit', 'Desconto_Pct', 'Receita_Liquida', 'Canal'],
    numericColumns: ['Qtd', 'Preco_Unit', 'Desconto_Pct', 'Receita_Liquida'],
    missions: [
      'Crie uma Tabela Dinâmica somando Receita_Liquida por Regiao e Canal.',
      'Use SOMASE para totalizar vendas apenas da categoria "Eletrônicos".',
      'Calcule o ticket médio por pedido e destaque vendas acima de R$ 2.000 com Formatação Condicional.',
    ],
  },
  {
    id: 'rh',
    name: 'RH & Folha Salarial',
    subtitle: 'Quadro de colaboradores, departamentos, cargos, salários, bônus e avaliação anual.',
    columns: ['Matricula', 'Colaborador', 'Departamento', 'Cargo', 'Admissao', 'Salario_Base', 'Bonus', 'Nota_Avaliacao', 'Status'],
    numericColumns: ['Salario_Base', 'Bonus', 'Nota_Avaliacao'],
    missions: [
      'Use MÉDIASES para descobrir o salário médio por Departamento considerando apenas Status "Ativo".',
      'Aplique SE para classificar quem tem Nota_Avaliacao >= 8,5 como "Elegível Promoção".',
      'Use PROCX ou PROCV em uma nova aba para buscar Cargo e Salario_Base a partir da Matricula.',
    ],
  },
  {
    id: 'financeiro',
    name: 'Fluxo de Caixa & Centro de Custo',
    subtitle: 'Lançamentos de receitas e despesas, centros de custo, vencimentos e status de pagamento.',
    columns: ['ID_Lanc', 'Data', 'Tipo', 'Centro_Custo', 'Categoria', 'Contraparte', 'Valor_BRL', 'Status_Pgto'],
    numericColumns: ['Valor_BRL'],
    missions: [
      'Monte um DRE simplificado usando SOMASES separando Receita vs Despesa por Centro_Custo.',
      'Use CONT.SE para contar quantos lançamentos estão com Status_Pgto "Atrasado".',
      'Calcule o saldo líquido geral e crie um gráfico de barras comparando despesas por categoria.',
    ],
  },
  {
    id: 'estoque',
    name: 'Controle de Estoque & Logística',
    subtitle: 'SKUs, armazéns, nível atual vs mínimo, custo unitário e prazo de reposição.',
    columns: ['SKU', 'Produto', 'Armazem', 'Estoque_Atual', 'Estoque_Minimo', 'Custo_Unit', 'Valor_Estoque', 'Prazo_Dias'],
    numericColumns: ['Estoque_Atual', 'Estoque_Minimo', 'Custo_Unit', 'Valor_Estoque', 'Prazo_Dias'],
    missions: [
      'Crie uma coluna "Alerta" usando =SE(D2<=E2;"Repor";"OK") para identificar ruptura de estoque.',
      'Calcule o capital imobilizado total por Armazem com SOMASE.',
      'Use ESQUERDA(A2;3) para agrupar os itens pelo prefixo de família do SKU.',
    ],
  },
  {
    id: 'suporte',
    name: 'Suporte & SLA de Atendimento',
    subtitle: 'Chamados técnicos, prioridade, canal de entrada, tempo de resolução e nota CSAT.',
    columns: ['Ticket', 'Data_Abertura', 'Prioridade', 'Canal', 'Analista', 'Horas_Resolucao', 'SLA_Meta_h', 'CSAT'],
    numericColumns: ['Horas_Resolucao', 'SLA_Meta_h', 'CSAT'],
    missions: [
      'Crie a coluna "Dentro_SLA" com =SE(F2<=G2;"Sim";"Estourado") e calcule o % de cumprimento.',
      'Use MÉDIASE para comparar Horas_Resolucao por Prioridade (Crítica, Alta, Média, Baixa).',
      'Proteja uma divisão de taxa de satisfação com SEERRO ao filtrar por analista.',
    ],
  },
];

// Fast deterministic PRNG (Mulberry32)
function createRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function formatDateBr(year: number, month: number, day: number): string {
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  return `${dd}/${mm}/${year}`;
}

const FIRST_NAMES = ['Ana', 'Bruno', 'Camila', 'Daniel', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João', 'Larissa', 'Marcos', 'Natália', 'Otávio', 'Paula', 'Rafael', 'Sofia', 'Thiago', 'Vanessa', 'Lucas'];
const LAST_NAMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Lima', 'Araújo', 'Fernandes', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Ribeiro', 'Mendes'];

const REGIONS = [
  {regiao: 'Sudeste', ufs: ['SP', 'RJ', 'MG', 'ES']},
  {regiao: 'Sul', ufs: ['PR', 'SC', 'RS']},
  {regiao: 'Nordeste', ufs: ['BA', 'PE', 'CE', 'RN']},
  {regiao: 'Centro-Oeste', ufs: ['DF', 'GO', 'MT']},
  {regiao: 'Norte', ufs: ['PA', 'AM', 'TO']},
];

const SALES_CATALOG = [
  {cat: 'Eletrônicos', prod: 'Fone Bluetooth ANC', price: 320},
  {cat: 'Eletrônicos', prod: 'Monitor 24 IPS', price: 890},
  {cat: 'Eletrônicos', prod: 'Webcam Full HD', price: 245},
  {cat: 'Periféricos', prod: 'Teclado Mecânico ABNT2', price: 360},
  {cat: 'Periféricos', prod: 'Mouse Ergonômico Sem Fio', price: 145},
  {cat: 'Periféricos', prod: 'Hub USB-C 7 Portas', price: 189},
  {cat: 'Escritório', prod: 'Cadeira Ergonômica Tela', price: 1240},
  {cat: 'Escritório', prod: 'Suporte Articulado Monitor', price: 210},
  {cat: 'Escritório', prod: 'Luminária LED Mesa', price: 155},
  {cat: 'Armazenamento', prod: 'SSD NVMe 1TB', price: 470},
];

export function generateDataset(scenarioId: ScenarioId, rowCount: number, injectDirtyData: boolean, seed: number): GeneratedDataset {
  const scenario = DATA_SCENARIOS.find((s) => s.id === scenarioId) || DATA_SCENARIOS[0];
  const rng = createRng(seed);
  const rows: Record<string, string | number>[] = [];

  for (let i = 1; i <= rowCount; i++) {
    if (scenarioId === 'vendas') {
      const reg = pick(rng, REGIONS);
      const uf = pick(rng, reg.ufs);
      const item = pick(rng, SALES_CATALOG);
      const qtd = randInt(rng, 1, 8);
      const desc = pick(rng, [0, 0, 0, 5, 10, 15]);
      const receita = Number((qtd * item.price * (1 - desc / 100)).toFixed(2));
      rows.push({
        ID_Pedido: `PED-${String(1000 + i)}`,
        Data: formatDateBr(2026, randInt(rng, 1, 10), randInt(rng, 1, 28)),
        Regiao: reg.regiao,
        UF: uf,
        Vendedor: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`,
        Categoria: item.cat,
        Produto: item.prod,
        Qtd: qtd,
        Preco_Unit: item.price,
        Desconto_Pct: desc,
        Receita_Liquida: receita,
        Canal: pick(rng, ['Site Próprio', 'Marketplace', 'B2B Direto', 'App Mobile']),
      });
    } else if (scenarioId === 'rh') {
      const dept = pick(rng, ['Dados & BI', 'Financeiro', 'Comercial', 'Operações', 'Produto', 'RH']);
      const cargo = pick(rng, ['Analista Jr', 'Analista Pleno', 'Analista Sênior', 'Especialista', 'Coordenador']);
      const baseMap: Record<string, number> = {
        'Analista Jr': 3600,
        'Analista Pleno': 5400,
        'Analista Sênior': 7800,
        Especialista: 9600,
        Coordenador: 11500,
      };
      const sal = baseMap[cargo] + randInt(rng, -300, 700);
      const nota = Number((6.2 + rng() * 3.8).toFixed(1));
      const bonus = nota >= 8.5 ? Math.round(sal * 0.25) : nota >= 7.5 ? Math.round(sal * 0.12) : 0;
      rows.push({
        Matricula: `MAT-${String(2000 + i)}`,
        Colaborador: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`,
        Departamento: dept,
        Cargo: cargo,
        Admissao: formatDateBr(randInt(rng, 2019, 2026), randInt(rng, 1, 12), randInt(rng, 1, 28)),
        Salario_Base: sal,
        Bonus: bonus,
        Nota_Avaliacao: nota,
        Status: rng() > 0.12 ? 'Ativo' : pick(rng, ['Férias', 'Licença', 'Desligado']),
      });
    } else if (scenarioId === 'financeiro') {
      const isReceita = rng() > 0.58;
      const tipo = isReceita ? 'Receita' : 'Despesa';
      const catRec = ['Venda Recorrente', 'Consultoria', 'Licenciamento', 'Projeto Pontual'];
      const catDesp = ['Infraestrutura Cloud', 'Folha e Encargos', 'Marketing Digital', 'Logística', 'Software SaaS', 'Aluguel Escritório'];
      const valor = isReceita ? randInt(rng, 1800, 24000) : randInt(rng, 450, 14500);
      rows.push({
        ID_Lanc: `FIN-${String(5000 + i)}`,
        Data: formatDateBr(2026, randInt(rng, 1, 10), randInt(rng, 1, 28)),
        Tipo: tipo,
        Centro_Custo: pick(rng, ['Tecnologia', 'Comercial', 'Administrativo', 'Operações', 'Marketing']),
        Categoria: isReceita ? pick(rng, catRec) : pick(rng, catDesp),
        Contraparte: isReceita ? `Cliente ${pick(rng, ['Alfa', 'Beta', 'Horizonte', 'NorteSul', 'Vértice', 'Prata'])} Ltda` : pick(rng, ['NuvemBR', 'LogFast', 'MídiaPrime', 'EnergiaSP', 'TechTools', 'ImobCorp']),
        Valor_BRL: isReceita ? valor : -valor,
        Status_Pgto: pick(rng, ['Pago', 'Pago', 'Pago', 'Pendente', 'Atrasado']),
      });
    } else if (scenarioId === 'estoque') {
      const familias = [
        {pref: 'ELE', prod: 'Fonte 65W USB-C', custo: 85},
        {pref: 'ELE', prod: 'Cabo HDMI 2.1 2m', custo: 28},
        {pref: 'PER', prod: 'Headset USB Escritório', custo: 112},
        {pref: 'PER', prod: 'Mousepad Estendido', custo: 34},
        {pref: 'INF', prod: 'Memória RAM 16GB DDR5', custo: 265},
        {pref: 'INF', prod: 'Roteador Wi-Fi 6', custo: 210},
        {pref: 'ESC', prod: 'Apoio Ergonômico Pés', custo: 58},
        {pref: 'ESC', prod: 'Organizador de Cabos', custo: 24},
      ];
      const f = pick(rng, familias);
      const min = randInt(rng, 15, 60);
      const atual = randInt(rng, 2, 130);
      rows.push({
        SKU: `${f.pref}-${String(300 + i)}`,
        Produto: f.prod,
        Armazem: pick(rng, ['CD-São Paulo', 'CD-Curitiba', 'CD-Recife', 'CD-Goiânia']),
        Estoque_Atual: atual,
        Estoque_Minimo: min,
        Custo_Unit: f.custo,
        Valor_Estoque: atual * f.custo,
        Prazo_Dias: randInt(rng, 3, 21),
      });
    } else {
      const prio = pick(rng, ['Crítica', 'Alta', 'Média', 'Baixa']);
      const metaMap: Record<string, number> = {Crítica: 4, Alta: 8, Média: 24, Baixa: 48};
      const meta = metaMap[prio];
      const horas = Number((meta * (0.35 + rng() * 0.95)).toFixed(1));
      const csat = horas <= meta ? Number((4.0 + rng() * 1.0).toFixed(1)) : Number((2.2 + rng() * 1.8).toFixed(1));
      rows.push({
        Ticket: `SUP-${String(8000 + i)}`,
        Data_Abertura: formatDateBr(2026, randInt(rng, 1, 10), randInt(rng, 1, 28)),
        Prioridade: prio,
        Canal: pick(rng, ['Chat', 'E-mail', 'WhatsApp', 'Portal Web']),
        Analista: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`,
        Horas_Resolucao: horas,
        SLA_Meta_h: meta,
        CSAT: csat,
      });
    }
  }

  if (injectDirtyData && rows.length >= 6) {
    const textCol = scenario.columns.find((c) => !scenario.numericColumns.includes(c) && !c.startsWith('ID') && c !== 'Data' && c !== 'Data_Abertura');
    for (let i = 0; i < rows.length; i++) {
      // Inject extra leading/trailing spaces in ~10% of rows
      if (textCol && i % 10 === 2) {
        rows[i][textCol] = `  ${rows[i][textCol]}  `;
      }
      // Inject empty cell in ~6% of rows
      if (textCol && i % 16 === 5) {
        rows[i][textCol] = '';
      }
    }
    // Inject 2 realistic duplicate rows
    const dupCount = Math.min(3, Math.max(1, Math.floor(rows.length * 0.05)));
    for (let d = 0; d < dupCount; d++) {
      const idx = randInt(rng, 0, rows.length - 1);
      rows.splice(idx, 0, {...rows[idx]});
    }
  }

  return {scenario, rows, dirtyInjected: injectDirtyData, seed};
}

export function datasetToTSV(dataset: GeneratedDataset): string {
  const {columns} = dataset.scenario;
  const header = columns.join('\t');
  const lines = dataset.rows.map((row) =>
    columns
      .map((col) => {
        const val = row[col];
        if (typeof val === 'number') {
          return String(val).replace('.', ',');
        }
        return String(val ?? '');
      })
      .join('\t')
  );
  return [header, ...lines].join('\n');
}

export function downloadDatasetCSV(dataset: GeneratedDataset): void {
  const {columns, id} = dataset.scenario;
  const escapeCsv = (val: string | number) => {
    const str = typeof val === 'number' ? String(val).replace('.', ',') : String(val ?? '');
    if (str.includes(';') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const header = columns.join(';');
  const body = dataset.rows.map((row) => columns.map((c) => escapeCsv(row[c])).join(';')).join('\r\n');
  // UTF-8 BOM ensures Excel PT-BR opens accents and ';' columns automatically
  const blob = new Blob(['\uFEFF' + header + '\r\n' + body], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `planilhalab_${id}_${dataset.rows.length}linhas.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadDatasetXLSX(dataset: GeneratedDataset): Promise<void> {
  // Dynamically loaded ONLY on click to keep initial load and battery impact minimal
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(dataset.rows, {header: dataset.scenario.columns});
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Base_Dados');

  // Add a second sheet with suggested study missions
  const missionRows = dataset.scenario.missions.map((m, idx) => ({
    Missao: idx + 1,
    Objetivo_Pratico: m,
  }));
  const wsMissions = XLSX.utils.json_to_sheet(missionRows);
  XLSX.utils.book_append_sheet(wb, wsMissions, 'Missoes_Estudo');

  XLSX.writeFile(wb, `planilhalab_${dataset.scenario.id}_${dataset.rows.length}linhas.xlsx`);
}
