const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Store para histórico de cálculos (em produção usar banco de dados)
let historicoCalculos = [];

// Classe para cálculos de importação baseada nas planilhas
class CalculadoraImportacao {
  static calcular(dados) {
    const {
      frete = 0,          // A - Frete em USD
      vmle = 0,           // B - VMLE em USD  
      taxaDolar = 5.5436, // C - Taxa do dólar
      seguro = 284.99,    // E - Seguro em BRL
      quantidade = 100,   // V - Quantidade
      aliqII = 16,        // Alíquota II (%)
      aliqIPI = 9.75,     // Alíquota IPI (%)
      aliqPIS = 2.1,      // Alíquota PIS (%)
      aliqCOFINS = 9.65,  // Alíquota COFINS (%)
      aliqPISCred = 1.65, // Alíquota PIS Crédito (%)
      aliqCOFINSCred = 7.65, // Alíquota COFINS Crédito (%)
      aliqICMS = 2.6,     // Alíquota ICMS (%)
      despesasAcessorias = 9252.55, // N - Despesas Acessórias
      despesasAduaneiras = 154.23   // R - Despesas Aduaneiras
    } = dados;

    // D = (A+B)*C - TOTAL em BRL
    const totalBRL = (frete + vmle) * taxaDolar;

    // F = D+E - VLR. BC I.I/PIS/COFINS
    const baseBC = totalBRL + seguro;

    // G = F*16% - I.I.
    const valorII = baseBC * (aliqII / 100);

    // H = F*2,1% - PIS - IMP.
    const pisImp = baseBC * (aliqPIS / 100);

    // I = F*1,65% - PIS - CRED.
    const pisCred = baseBC * (aliqPISCred / 100);

    // J = H-I - CUSTO PIS
    const custoPIS = pisImp - pisCred;

    // K = F*9,65% - COFINS - IMP.
    const cofinsImp = baseBC * (aliqCOFINS / 100);

    // L = F*7,65% - COFINS - CRED.
    const cofinsCred = baseBC * (aliqCOFINSCred / 100);

    // M = K-L - CUSTO COFINS
    const custoCOFINS = cofinsImp - cofinsCred;

    // Base IPI = VMLE convertido + II
    const baseIPI = vmle * taxaDolar + valorII;
    
    // O - IPI
    const valorIPI = baseIPI * (aliqIPI / 100);

    // Base ICMS = (VMLE + Vlr. II + Vlr. IPI + Vlr. PIS + Vlr. Cofins + Desp. Adun)/0,96
    const baseICMS = (vmle * taxaDolar + valorII + valorIPI + pisImp + cofinsImp + despesasAduaneiras) / 0.96;

    // Q - ICMS
    const valorICMS = baseICMS * (aliqICMS / 100);

    // S = F+G+H+K+O+R - VALOR TOTAL DA NF
    const valorTotalNF = baseBC + valorII + pisImp + cofinsImp + valorIPI + despesasAduaneiras;

    // T = F+G+J+M+N-Q+R - CUSTO TOTAL EM REAL
    const custoTotalReal = baseBC + valorII + custoPIS + custoCOFINS + despesasAcessorias - valorICMS + despesasAduaneiras;

    // U = T/C - CUSTO TOTAL EM DÓLAR
    const custoTotalDolar = custoTotalReal / taxaDolar;

    // X = U/V - CUSTO UNITÁRIO EM DÓLAR
    const custoUnitarioDolar = custoTotalDolar / quantidade;

    // Z = X*C - CUSTO UNITÁRIO EM REAL
    const custoUnitarioReal = custoUnitarioDolar * taxaDolar;

    return {
      // Valores de entrada
      frete,
      vmle,
      taxaDolar,
      seguro,
      quantidade,
      
      // Cálculos intermediários
      totalBRL: parseFloat(totalBRL.toFixed(4)),
      baseBC: parseFloat(baseBC.toFixed(4)),
      
      // Impostos
      valorII: parseFloat(valorII.toFixed(2)),
      pisImp: parseFloat(pisImp.toFixed(4)),
      pisCred: parseFloat(pisCred.toFixed(4)),
      custoPIS: parseFloat(custoPIS.toFixed(4)),
      cofinsImp: parseFloat(cofinsImp.toFixed(4)),
      cofinsCred: parseFloat(cofinsCred.toFixed(4)),
      custoCOFINS: parseFloat(custoCOFINS.toFixed(4)),
      valorIPI: parseFloat(valorIPI.toFixed(2)),
      baseICMS: parseFloat(baseICMS.toFixed(2)),
      valorICMS: parseFloat(valorICMS.toFixed(5)),
      
      // Despesas
      despesasAcessorias,
      despesasAduaneiras,
      
      // Totais finais
      valorTotalNF: parseFloat(valorTotalNF.toFixed(4)),
      custoTotalReal: parseFloat(custoTotalReal.toFixed(6)),
      custoTotalDolar: parseFloat(custoTotalDolar.toFixed(6)),
      custoUnitarioDolar: parseFloat(custoUnitarioDolar.toFixed(6)),
      custoUnitarioReal: parseFloat(custoUnitarioReal.toFixed(6))
    };
  }

  static gerarRelatorioPDF(dados, resultado) {
    // Gerar dados estruturados para PDF
    return {
      titulo: 'Relatório de Cálculo de Importação',
      data: new Date().toLocaleDateString('pt-BR'),
      dadosEntrada: dados,
      resultados: resultado,
      resumo: {
        valorTotalImportacao: resultado.valorTotalNF,
        custoFinalUnitario: resultado.custoUnitarioReal,
        economiaCreditos: resultado.custoPIS + resultado.custoCOFINS
      }
    };
  }
}

// Rotas da API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Calculadora de Importação API funcionando',
    versao: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/calcular', (req, res) => {
  try {
    const dados = req.body;
    
    // Validações básicas
    if (!dados.frete || !dados.vmle) {
      return res.status(400).json({ 
        error: 'Frete e VMLE são obrigatórios',
        details: 'Campos obrigatórios: frete (USD), vmle (USD)'
      });
    }

    if (dados.taxaDolar <= 0) {
      return res.status(400).json({ 
        error: 'Taxa do dólar deve ser maior que zero',
        details: 'Informe uma taxa de câmbio válida'
      });
    }

    const resultado = CalculadoraImportacao.calcular(dados);
    
    // Adicionar ao histórico
    const calculo = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      dados,
      resultado
    };
    
    historicoCalculos.unshift(calculo);
    
    // Manter apenas os últimos 50 cálculos
    if (historicoCalculos.length > 50) {
      historicoCalculos = historicoCalculos.slice(0, 50);
    }
    
    res.json({
      success: true,
      dados: resultado,
      id: calculo.id,
      timestamp: calculo.timestamp
    });
    
  } catch (error) {
    console.error('Erro no cálculo:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno no servidor',
      details: error.message 
    });
  }
});

// Rota para histórico de cálculos
app.get('/api/historico', (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const historico = historicoCalculos.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      historico,
      total: historicoCalculos.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Erro ao buscar histórico'
    });
  }
});

// Rota para obter cálculo específico
app.get('/api/calculo/:id', (req, res) => {
  try {
    const { id } = req.params;
    const calculo = historicoCalculos.find(c => c.id === parseInt(id));
    
    if (!calculo) {
      return res.status(404).json({
        success: false,
        error: 'Cálculo não encontrado'
      });
    }
    
    res.json({
      success: true,
      calculo
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Erro ao buscar cálculo'
    });
  }
});

// Rota para gerar relatório
app.post('/api/relatorio/:id', (req, res) => {
  try {
    const { id } = req.params;
    const calculo = historicoCalculos.find(c => c.id === parseInt(id));
    
    if (!calculo) {
      return res.status(404).json({
        success: false,
        error: 'Cálculo não encontrado'
      });
    }
    
    const relatorio = CalculadoraImportacao.gerarRelatorioPDF(calculo.dados, calculo.resultado);
    
    res.json({
      success: true,
      relatorio
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Erro ao gerar relatório'
    });
  }
});

// Rota para validar cálculo específico da planilha
app.post('/api/validar-planilha', (req, res) => {
  try {
    // Dados exatos da planilha para validação
    const dadosPlanilha = {
      frete: 1196.5,
      vmle: 12720,
      taxaDolar: 5.5436,
      seguro: 284.99,
      quantidade: 100
    };
    
    const resultado = CalculadoraImportacao.calcular(dadosPlanilha);
    
    // Valores esperados da planilha
    const valoresEsperados = {
      totalBRL: 77147.51,
      baseBC: 77432.50,
      valorII: 12389.20,
      valorIPI: 8757.62,
      custoTotalReal: 98243.85,
      custoUnitarioReal: 982.44
    };
    
    const diferencas = Object.keys(valoresEsperados).map(key => ({
      campo: key,
      calculado: resultado[key],
      esperado: valoresEsperados[key],
      diferenca: Math.abs(resultado[key] - valoresEsperados[key]),
      percentualErro: Math.abs((resultado[key] - valoresEsperados[key]) / valoresEsperados[key] * 100)
    }));
    
    const validacao = {
      success: true,
      calculado: resultado,
      esperado: valoresEsperados,
      diferencas,
      precisao: diferencas.every(d => d.percentualErro < 0.1), // Menos de 0.1% de erro
      resumo: {
        camposValidados: diferencas.length,
        camposOK: diferencas.filter(d => d.percentualErro < 0.1).length,
        maiorErro: Math.max(...diferencas.map(d => d.percentualErro))
      }
    };
    
    res.json(validacao);
    
  } catch (error) {
    console.error('Erro na validação:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro na validação',
      details: error.message 
    });
  }
});

// Rota para estatísticas
app.get('/api/estatisticas', (req, res) => {
  try {
    if (historicoCalculos.length === 0) {
      return res.json({
        success: true,
        estatisticas: {
          totalCalculos: 0,
          message: 'Nenhum cálculo realizado ainda'
        }
      });
    }
    
    const valores = historicoCalculos.map(h => h.resultado);
    
    const estatisticas = {
      totalCalculos: historicoCalculos.length,
      mediaValorImportacao: valores.reduce((acc, v) => acc + v.valorTotalNF, 0) / valores.length,
      mediaCustoUnitario: valores.reduce((acc, v) => acc + v.custoUnitarioReal, 0) / valores.length,
      maiorImportacao: Math.max(...valores.map(v => v.valorTotalNF)),
      menorImportacao: Math.min(...valores.map(v => v.valorTotalNF)),
      ultimoCalculo: historicoCalculos[0]?.timestamp
    };
    
    res.json({
      success: true,
      estatisticas
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Erro ao calcular estatísticas'
    });
  }
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Erro interno do servidor' 
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Rota não encontrada' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 API da Calculadora de Importação disponível em http://localhost:${PORT}`);
  console.log(`📋 Rotas disponíveis:`);
  console.log(`   GET  /api/health - Status da API`);
  console.log(`   POST /api/calcular - Calcular custos`);
  console.log(`   GET  /api/historico - Histórico de cálculos`);
  console.log(`   GET  /api/calculo/:id - Cálculo específico`);
  console.log(`   POST /api/relatorio/:id - Gerar relatório`);
  console.log(`   POST /api/validar-planilha - Validar contra planilha`);
  console.log(`   GET  /api/estatisticas - Estatísticas dos cálculos`);
});

module.exports = app;