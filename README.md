# 📊 Calculadora de Importação

Sistema web completo para substituir planilhas Excel de cálculo de custos de importação.

## 🚀 Características

- **Frontend React com TypeScript** - Interface moderna e responsiva
- **Backend Node.js/Express** - API robusta para cálculos
- **Cálculos Idênticos às Planilhas** - Fórmulas exatamente iguais às planilhas Excel originais
- **Validação de Dados** - Verificação automática contra valores conhecidos
- **Interface Intuitiva** - Formulários organizados por categorias
- **Formatação Brasileira** - Valores em Real e Dólar formatados corretamente

## 🏗️ Estrutura do Projeto

```
calculadora-importacao/
├── backend/                 # API Node.js
│   ├── server.js           # Servidor principal
│   └── package.json        # Dependências do backend
├── frontend/               # App React
│   ├── src/
│   │   ├── App.tsx        # Componente principal
│   │   └── App.css        # Estilos
│   └── package.json       # Dependências do frontend
└── package.json           # Scripts principais
```

## 📋 Funcionalidades

### Cálculos Implementados
- **Valores Base**: Frete (USD), VMLE (USD), Taxa do Dólar
- **Impostos**: II, IPI, PIS, COFINS, ICMS
- **Despesas**: Acessórias, Aduaneiras
- **Totais**: Valor Total NF, Custo Total (Real/Dólar), Custo Unitário

### Fórmulas (idênticas à planilha)
- `D = (A+B)*C` - Total BRL
- `F = D+E` - Base BC
- `G = F*16%` - II
- `J = (F*2,1%) - (F*1,65%)` - Custo PIS
- `M = (F*9,65%) - (F*7,65%)` - Custo COFINS
- `T = F+G+J+M+N-Q+R` - Custo Total Real
- E mais...

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js 16+ 
- npm ou yarn

### Instalação
```bash
# Instalar todas as dependências
npm run install:all

# Ou instalar separadamente:
# Backend
cd backend && npm install

# Frontend  
cd frontend && npm install
```

### Executar em Desenvolvimento
```bash
# Executar backend e frontend simultaneamente
npm run dev

# Ou executar separadamente:
# Backend (porta 5000)
npm run dev:backend

# Frontend (porta 3000)
npm run dev:frontend
```

### Acessar a aplicação
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🧮 Como Usar

1. **Preencher Dados de Entrada**:
   - Frete e VMLE em USD
   - Taxa do dólar atual
   - Alíquotas de impostos
   - Despesas em BRL

2. **Calcular**: Clique em "Calcular Custos"

3. **Visualizar Resultados**: 
   - Valores base e impostos
   - Totais finais
   - Custos unitários

4. **Validar**: Use "Validar contra Planilha Original" para verificar precisão

## 📊 API Endpoints

### `POST /api/calcular`
Calcula custos de importação
```json
{
  "frete": 1196.5,
  "vmle": 12720,
  "taxaDolar": 5.5436,
  "seguro": 284.99,
  "quantidade": 100,
  "aliqII": 16,
  "aliqIPI": 9.75,
  ...
}
```

### `POST /api/validar-planilha`
Valida cálculos contra dados conhecidos da planilha

### `GET /api/health`
Verifica status do servidor

## 🎯 Valores de Teste (da planilha original)

- **Frete**: $1.196,50
- **VMLE**: $12.720,00  
- **Taxa**: R$ 5,5436
- **Total Esperado**: R$ 77.147,51
- **Custo Total Real**: R$ 98.243,85
- **Custo Unitário**: R$ 982,44

## 🔧 Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Axios, CSS3
- **Backend**: Node.js, Express, CORS, Helmet
- **Ferramentas**: Concurrently, Nodemon

## 📈 Próximas Funcionalidades

- [ ] Exportação para PDF/Excel
- [ ] Histórico de cálculos
- [ ] Múltiplas moedas
- [ ] Dashboard com gráficos
- [ ] API de cotação automática
- [ ] Salvamento local/nuvem

## 🤝 Contribuição

Este sistema foi desenvolvido para substituir completamente as planilhas Excel, mantendo exatamente os mesmos cálculos e fórmulas para garantir compatibilidade total.

## 📞 Suporte

Para dúvidas sobre cálculos ou funcionalidades, consulte os arquivos de referência das planilhas originais ou verifique os logs da validação automática.