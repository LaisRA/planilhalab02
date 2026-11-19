# PlanilhaLab — App Local e Offline para Estudos de Excel

Aplicativo web leve, gratuito e pronto para uso offline (PWA) criado para ensinar **Excel do básico ao avançado** com foco em prática real, baixo consumo de bateria e salvamento 100% local do progresso.

---

## Principais Recursos

- **Trilha Estruturada (Básico ao Avançado):** 4 módulos progressivos (13 aulas) com videoaulas gratuitas e avulsas do YouTube (sem playlists), carregadas apenas sob demanda para economizar bateria e dados móveis, além de resumos completos disponíveis offline.
- **Mini Planilha Interativa:** 10 exercícios práticos com barra de fórmulas (`fx`), avaliação real em Português (`SOMA`, `MÉDIA`, `SE`, `SOMASE`, `CONT.SE`, `ESQUERDA`, `PROCV`, `PROCX`, `SEERRO`) e Inglês (`SUM`, `AVERAGE`, `IF`, `SUMIF`, `COUNTIF`, `LEFT`, `VLOOKUP`, `XLOOKUP`, `IFERROR`), dicas progressivas e correção automática.
- **Desafios Rápidos:** 8 cenários práticos de múltipla escolha sobre Tabelas Dinâmicas, Power Query, Dashboards, referências absolutas (`$`), erros do Excel e Macros/VBA.
- **Gerador de Dados Fictícios:** Crie bases realistas 100% offline em 5 cenários corporativos (*Vendas E-commerce*, *RH & Folha*, *Fluxo de Caixa*, *Estoque & Logística* e *Suporte & SLA*), com opção de injetar inconsistências realistas (espaços extras, duplicados e vazios) e exportação em **Copiar para Excel (TSV)**, **CSV (PT-BR)** e **`.xlsx`**.
- **Guia Rápido Offline:** Dicionário pesquisável com 24 fórmulas (PT-BR ↔ EN), tabela de 7 códigos de erro comuns e 20 atalhos de teclado (Windows e macOS).
- **Timer de Foco, Anotações e Lembretes:** Cronômetro Pomodoro/personalizado de baixo consumo, caderno de anotações vinculado às aulas, agenda de lembretes de estudo, alternância entre **Modo Claro** e **Modo Escuro (economia de bateria)** e backup/restauração local em `.json`.

---

## Usar como Aplicativo Offline (Sem Instalar Nada de Programação)

1. Abra o link publicado do **PlanilhaLab** no Chrome, Edge ou Safari.
2. Clique em **Instalar App Offline** na barra lateral (ou no ícone de instalação da barra de endereços; no iPhone/iPad, toque em *Compartilhar → Adicionar à Tela de Início*).
3. Pronto! O app funcionará de forma independente e offline no seu computador ou celular, salvando o progresso localmente no dispositivo. *(Apenas a reprodução das videoaulas do YouTube exige internet.)*

---

## Rodar Localmente no Computador

Pré-requisito: **Node.js 18+** instalado.

```bash
# 1. Instalar dependências
npm install

# 2. Rodar em modo de desenvolvimento
npm run dev
```

Acesse em `http://localhost:3000`.

### Gerar versão otimizada de produção (com PWA completo)

```bash
npm run build
npm run preview
```

---

## Publicar Gratuitamente na Vercel

1. Suba este repositório para a sua conta do GitHub.
2. Acesse [vercel.com](https://vercel.com) e importe o repositório.
3. Mantenha o comando de build `npm run build` e o diretório de saída `dist`.
4. Clique em **Deploy** para obter seu link HTTPS pronto para compartilhar.

---

## Contato e Créditos

**Criado por LAIS RANIELE**  
WhatsApp: [(37) 99904-6824](https://wa.me/5537999046824)
