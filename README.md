# Sistema de Administração de Campeonato de Badminton 🏸

Sistema completo para gerenciar campeonatos de badminton com cadastro de jogadores, categorias, geração automática de jogos e tabela de classificação.

## 🚀 Funcionalidades

- ✅ Cadastro de jogadores por categoria
- ✅ Gerenciamento de categorias
- ✅ Geração automática de jogos (todos contra todos por categoria)
- ✅ Inserção de placares e resultados
- ✅ Tabela de classificação automática por categoria
- ✅ Interface responsiva e moderna
- ✅ Acesso público (qualquer pessoa pode cadastrar)

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado:
- Node.js (versão 18 ou superior)
- npm ou yarn
- Conta no Supabase
- Conta no Vercel (para deploy)

## 🛠️ Configuração do Supabase

1. Acesse o painel do Supabase: https://swrirrtlraudksgoknxh.supabase.co
2. Vá para o SQL Editor
3. Execute o script que está no arquivo `supabase-setup.sql`
4. Isso criará todas as tabelas necessárias e algumas categorias de exemplo

## 💻 Instalação e Execução Local

1. Clone o repositório:
```bash
git clone https://github.com/mellongatti/badminton20.git
cd badminton20
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o projeto em modo de desenvolvimento:
```bash
npm run dev
```

4. Abra http://localhost:3000 no seu navegador

## 🚀 Deploy no Vercel

1. Faça push do código para o GitHub
2. Conecte seu repositório no Vercel
3. O deploy será automático

## 📖 Como Usar

### 1. Cadastrar Categorias
- Acesse a aba "Categorias"
- Adicione categorias como "Masculino Iniciante", "Feminino Avançado", etc.
- Edite ou exclua categorias conforme necessário

### 2. Cadastrar Jogadores
- Acesse a aba "Jogadores"
- Adicione jogadores selecionando nome e categoria
- Visualize, edite ou exclua jogadores na lista

### 3. Gerar Jogos
- Acesse a aba "Jogos"
- Selecione uma categoria
- Clique em "Gerar Jogos" para criar automaticamente todos os confrontos
- Cada jogador jogará uma vez contra cada adversário da mesma categoria

### 4. Inserir Resultados
- Na aba "Jogos", defina a data de cada jogo
- Insira o placar final de cada partida
- O sistema automaticamente determina o vencedor

### 5. Ver Classificação
- Acesse a aba "Classificação"
- Visualize a tabela de cada categoria ordenada por:
  1. Porcentagem de vitórias
  2. Número de vitórias
  3. Saldo de pontos
- O campeão de cada categoria é destacado com 🏆

## 🏗️ Estrutura do Projeto

```
badminton-championship/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Layout principal
│   │   ├── page.tsx            # Página principal
│   │   └── globals.css         # Estilos globais
│   ├── components/
│   │   ├── PlayerForm.tsx      # Formulário de jogadores
│   │   ├── PlayerList.tsx      # Lista de jogadores
│   │   ├── CategoryForm.tsx    # Formulário de categorias
│   │   ├── CategoryList.tsx    # Lista de categorias
│   │   ├── GamesList.tsx       # Gerenciamento de jogos
│   │   └── Standings.tsx       # Tabela de classificação
│   └── lib/
│       └── supabase.ts         # Configuração do Supabase
├── supabase-setup.sql          # Script de configuração do banco
└── README.md
```

## 🗄️ Estrutura do Banco de Dados

### Tabela `categories`
- `id`: Identificador único
- `name`: Nome da categoria
- `created_at`: Data de criação

### Tabela `players`
- `id`: Identificador único
- `name`: Nome do jogador
- `category_id`: Referência à categoria
- `created_at`: Data de criação

### Tabela `games`
- `id`: Identificador único
- `player1_id`: Primeiro jogador
- `player2_id`: Segundo jogador
- `category_id`: Categoria do jogo
- `game_date`: Data do jogo
- `player1_score`: Placar do primeiro jogador
- `player2_score`: Placar do segundo jogador
- `winner_id`: ID do vencedor
- `created_at`: Data de criação

## 🎯 Tecnologias Utilizadas

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Supabase** - Banco de dados e backend
- **Lucide React** - Ícones
- **Vercel** - Deploy e hospedagem

## 📝 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

---

Desenvolvido com ❤️ para a comunidade de badminton