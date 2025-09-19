import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

interface DadosCalculadora {
  frete: number | string;
  vmle: number | string;
  taxaDolar: number | string;
  seguro: number | string;
  quantidade: number | string;
  aliqII: number | string;
  aliqIPI: number | string;
  aliqPIS: number | string;
  aliqCOFINS: number | string;
  aliqPISCred: number | string;
  aliqCOFINSCred: number | string;
  aliqICMS: number | string;
  despesasAcessorias: number | string;
  despesasAduaneiras: number | string;
}

interface ResultadoCalculadora {
  frete: number;
  vmle: number;
  taxaDolar: number;
  seguro: number;
  quantidade: number;
  totalBRL: number;
  baseBC: number;
  valorII: number;
  pisImp: number;
  pisCred: number;
  custoPIS: number;
  cofinsImp: number;
  cofinsCred: number;
  custoCOFINS: number;
  valorIPI: number;
  baseICMS: number;
  valorICMS: number;
  despesasAcessorias: number;
  despesasAduaneiras: number;
  valorTotalNF: number;
  custoTotalReal: number;
  custoTotalDolar: number;
  custoUnitarioDolar: number;
  custoUnitarioReal: number;
}

const API_BASE_URL = 'http://localhost:6100/api';

function App() {
  const [dados, setDados] = useState<DadosCalculadora>({
    frete: 1196.5,
    vmle: 12720,
    taxaDolar: 5.5436,
    seguro: 284.99,
    quantidade: 100,
    aliqII: 16,
    aliqIPI: 9.75,
    aliqPIS: 2.1,
    aliqCOFINS: 9.65,
    aliqPISCred: 1.65,
    aliqCOFINSCred: 7.65,
    aliqICMS: 2.6,
    despesasAcessorias: 9252.55,
    despesasAduaneiras: 154.23
  });

  // Estado separado para valores formatados dos campos monetários
  const [valoresFormatados, setValoresFormatados] = useState<{[key: string]: string}>(() => {
    return {
      frete: '1.196,50',
      vmle: '12.720,00',
      taxaDolar: '5,5436',
      seguro: '284,99',
      despesasAcessorias: '9.252,55',
      despesasAduaneiras: '154,23'
    };
  });

  const [resultado, setResultado] = useState<ResultadoCalculadora | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        await axios.get(`${API_BASE_URL}/health?t=${Date.now()}`, {
          timeout: 4000,
          validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
          headers: { 'Cache-Control': 'no-store' }
        });
        setServerStatus('online');
      } catch (error) {
        setServerStatus('offline');
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number, currency: 'BRL' | 'USD' = 'BRL'): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(value);
  };

  const getDisplayValue = (campo: keyof DadosCalculadora, value: number | string): string => {
    // Para campos monetários, usar o valor formatado
    if (isMonetaryField(campo)) {
      return valoresFormatados[campo] || '';
    }
    
    // Para outros campos (alíquotas e quantidade), exibir o valor diretamente
    if (value === '') return '';
    
    // Se for número, converter para string mantendo decimais com vírgula
    if (typeof value === 'number') {
      return value.toString().replace('.', ',');
    }
    
    // Se for string, manter como está e garantir que use vírgula
    return String(value).replace('.', ',');
  };

  // Função para formatar valor monetário brasileiro em tempo real
  const formatMonetaryValue = (value: string): string => {
    // Remove tudo que não é dígito
    const digitsOnly = value.replace(/\D/g, '');
    
    // Se estiver vazio, retorna vazio
    if (!digitsOnly) return '';
    
    // Converte para centavos
    const cents = parseInt(digitsOnly);
    
    // Converte centavos para valor decimal
    const decimalValue = cents / 100;
    
    // Formata usando Intl.NumberFormat para o padrão brasileiro
    return decimalValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para converter valor formatado de volta para número
  const parseMonetaryValue = (formattedValue: string): number => {
    if (!formattedValue) return 0;
    
    // Remove pontos de milhares e substitui vírgula por ponto
    const cleanValue = formattedValue
      .replace(/\./g, '')
      .replace(',', '.');
    
    return parseFloat(cleanValue) || 0;
  };

  // Função para identificar se um campo é monetário
  const isMonetaryField = (fieldName: keyof DadosCalculadora): boolean => {
    const monetaryFields = [
      'frete', 'vmle', 'taxaDolar', 'seguro', 
      'despesasAcessorias', 'despesasAduaneiras'
    ];
    return monetaryFields.includes(fieldName);
  };

  const handleInputChange = (campo: keyof DadosCalculadora, valor: string) => {
    if (isMonetaryField(campo)) {
      // Para campos monetários, aplicar formatação
      // Se o usuário está deletando (valor vazio), limpar o campo
      if (valor === '') {
        setValoresFormatados(prev => ({ ...prev, [campo]: '' }));
        setDados(prev => ({ ...prev, [campo]: 0 }));
        return;
      }
      
      // Extrair apenas dígitos do valor digitado
      const novosDigitos = valor.replace(/\D/g, '');
      
      // Se não há dígitos, limpar
      if (!novosDigitos) {
        setValoresFormatados(prev => ({ ...prev, [campo]: '' }));
        setDados(prev => ({ ...prev, [campo]: 0 }));
        return;
      }
      
      // Formatar o valor
      const valorFormatado = formatMonetaryValue(novosDigitos);
      const valorNumerico = parseMonetaryValue(valorFormatado);
      
      setValoresFormatados(prev => ({ ...prev, [campo]: valorFormatado }));
      setDados(prev => ({ ...prev, [campo]: valorNumerico }));
    } else {
      // Para campos de porcentagem e quantidade, permitir entrada natural de decimais
      if (valor === '') {
        setDados(prev => ({ ...prev, [campo]: '' }));
        return;
      }
      
      // Permitir apenas dígitos, vírgula e ponto
      let valorLimpo = valor.replace(/[^0-9.,]/g, '');
      
      // Se não há caracteres válidos, limpar
      if (!valorLimpo) {
        setDados(prev => ({ ...prev, [campo]: '' }));
        return;
      }
      
      // Normalizar separadores decimais - converter pontos para vírgulas (padrão brasileiro)
      valorLimpo = valorLimpo.replace(/\./g, ',');
      
      // Permitir apenas uma vírgula
      const partesVirgula = valorLimpo.split(',');
      if (partesVirgula.length > 2) {
        // Se há mais de uma vírgula, manter apenas a primeira
        valorLimpo = partesVirgula[0] + ',' + partesVirgula.slice(1).join('');
      }
      
      // Aplicar lógica de remoção de zeros à esquerda APENAS se:
      // 1. Começa com zero
      // 2. Tem mais de um caractere
      // 3. NÃO é um decimal válido (0,X)
      // 4. O segundo caractere não é vírgula
      let valorProcessado = valorLimpo;
      if (valorProcessado.length > 1 && 
          valorProcessado.startsWith('0') && 
          valorProcessado.charAt(1) !== ',') {
        
        // Encontrar o primeiro dígito não-zero ou vírgula
        let indiceInicioValido = 0;
        for (let i = 0; i < valorProcessado.length; i++) {
          if (valorProcessado.charAt(i) !== '0') {
            indiceInicioValido = i;
            break;
          }
        }
        
        // Se todos são zeros, manter apenas um zero
        if (indiceInicioValido === 0 && valorProcessado.replace(/0/g, '').replace(/,/g, '') === '') {
          valorProcessado = valorProcessado.includes(',') ? valorProcessado : '0';
        } else if (indiceInicioValido > 0) {
          valorProcessado = valorProcessado.substring(indiceInicioValido);
        }
      }
      
      // Aceitar qualquer entrada válida (números, vírgula, parciais)
      setDados(prev => ({ ...prev, [campo]: valorProcessado }));
    }
  };

  const calcular = async () => {
    setLoading(true);
    setError(null);
    try {
      // Converter strings vazias para números antes de enviar
      const dadosParaEnvio = Object.keys(dados).reduce((acc, key) => {
        const valor = dados[key as keyof DadosCalculadora];
        if (typeof valor === 'string') {
          if (valor === '') {
            acc[key as keyof DadosCalculadora] = 0;
          } else {
            // Converter vírgula para ponto e tentar converter para número
            const valorConvertido = parseFloat(valor.replace(',', '.'));
            acc[key as keyof DadosCalculadora] = isNaN(valorConvertido) ? 0 : valorConvertido;
          }
        } else {
          acc[key as keyof DadosCalculadora] = Number(valor);
        }
        return acc;
      }, {} as any);

      const response = await axios.post(`${API_BASE_URL}/calcular`, dadosParaEnvio);
      if (response.data.success) {
        setResultado(response.data.dados);
      } else {
        setError(response.data.error || 'Erro no cálculo');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-corporate">
      <div className="App">
        <header className="compex-header">
          <div className="compex-header-content">
            <h1>COMPEX</h1>
            <span>Calculadora de Importação</span>
            <div className={`server-status ${serverStatus}`}>
              {serverStatus === 'online' ? '🟢' :
                serverStatus === 'offline' ? '🔴' :
                '🟡'}
            </div>
          </div>
        </header>

        <main className="main-content">
          <div className="content-grid">
            <section className="input-section">
              <h2>Calculadora de Importação</h2>
              
              <div className="input-group">
                <h3>Valores Principais (USD)</h3>
                <div className="form-row">
                  <label>
                    Frete (A):
                    <input type="text" value={getDisplayValue('frete', dados.frete)} onChange={(e) => handleInputChange('frete', e.target.value)} />
                  </label>
                  <label>
                    VMLE (B):
                    <input type="text" value={getDisplayValue('vmle', dados.vmle)} onChange={(e) => handleInputChange('vmle', e.target.value)} />
                  </label>
                </div>
              </div>

              <div className="input-group">
                <h3>Parâmetros Fiscais</h3>
                <div className="form-row">
                  <label>
                    Taxa do Dólar (C):
                    <input type="text" value={getDisplayValue('taxaDolar', dados.taxaDolar)} onChange={(e) => handleInputChange('taxaDolar', e.target.value)} />
                  </label>
                  <label>
                    Seguro (E) - BRL:
                    <input type="text" value={getDisplayValue('seguro', dados.seguro)} onChange={(e) => handleInputChange('seguro', e.target.value)} />
                  </label>
                  <label>
                    Quantidade (V):
                    <input type="text" value={getDisplayValue('quantidade', dados.quantidade)} onChange={(e) => handleInputChange('quantidade', e.target.value)} />
                  </label>
                </div>
              </div>

              <div className="input-group">
                <h3>Alíquotas de Impostos (%)</h3>
                <div className="form-row">
                  <label>II: <input type="text" value={getDisplayValue('aliqII', dados.aliqII)} onChange={(e) => handleInputChange('aliqII', e.target.value)} /></label>
                  <label>IPI: <input type="text" value={getDisplayValue('aliqIPI', dados.aliqIPI)} onChange={(e) => handleInputChange('aliqIPI', e.target.value)} /></label>
                  <label>PIS: <input type="text" value={getDisplayValue('aliqPIS', dados.aliqPIS)} onChange={(e) => handleInputChange('aliqPIS', e.target.value)} /></label>
                  <label>COFINS: <input type="text" value={getDisplayValue('aliqCOFINS', dados.aliqCOFINS)} onChange={(e) => handleInputChange('aliqCOFINS', e.target.value)} /></label>
                </div>
                <div className="form-row">
                  <label>PIS Crédito: <input type="text" value={getDisplayValue('aliqPISCred', dados.aliqPISCred)} onChange={(e) => handleInputChange('aliqPISCred', e.target.value)} /></label>
                  <label>COFINS Crédito: <input type="text" value={getDisplayValue('aliqCOFINSCred', dados.aliqCOFINSCred)} onChange={(e) => handleInputChange('aliqCOFINSCred', e.target.value)} /></label>
                  <label>ICMS: <input type="text" value={getDisplayValue('aliqICMS', dados.aliqICMS)} onChange={(e) => handleInputChange('aliqICMS', e.target.value)} /></label>
                </div>
              </div>

              <div className="input-group">
                <h3>Despesas (BRL)</h3>
                <div className="form-row">
                  <label>
                    Despesas Acessórias (N):
                    <input type="text" value={getDisplayValue('despesasAcessorias', dados.despesasAcessorias)} onChange={(e) => handleInputChange('despesasAcessorias', e.target.value)} />
                  </label>
                  <label>
                    Despesas Aduaneiras (R):
                    <input type="text" value={getDisplayValue('despesasAduaneiras', dados.despesasAduaneiras)} onChange={(e) => handleInputChange('despesasAduaneiras', e.target.value)} />
                  </label>
                </div>
              </div>

              <button onClick={calcular} className="btn btn-primary btn-large" disabled={loading || serverStatus !== 'online'}>
                {loading ? '🔄 Calculando...' : 'Calcular Custos'}
              </button>

              {error && <div className="error-message">{error}</div>}
            </section>

            {resultado && (
              <section className="results-section">
                <h2>Resultados</h2>
                <div className="results-grid">
                  <div className="result-card">
                    <h3>Valores Base</h3>
                    <div className="result-item"><span>Total BRL (D):</span><span>{formatCurrency(resultado.totalBRL)}</span></div>
                    <div className="result-item"><span>Base BC (F):</span><span>{formatCurrency(resultado.baseBC)}</span></div>
                  </div>
                  <div className="result-card">
                    <h3>Impostos</h3>
                    <div className="result-item"><span>II (G):</span><span>{formatCurrency(resultado.valorII)}</span></div>
                    <div className="result-item"><span>IPI (O):</span><span>{formatCurrency(resultado.valorIPI)}</span></div>
                    <div className="result-item"><span>Custo PIS (J):</span><span>{formatCurrency(resultado.custoPIS)}</span></div>
                    <div className="result-item"><span>Custo COFINS (M):</span><span>{formatCurrency(resultado.custoCOFINS)}</span></div>
                    <div className="result-item"><span>ICMS (Q):</span><span>{formatCurrency(resultado.valorICMS)}</span></div>
                  </div>
                  <div className="result-card highlight">
                    <h3>Totais Finais</h3>
                    <div className="result-item"><span>Valor Total NF (S):</span><span>{formatCurrency(resultado.valorTotalNF)}</span></div>
                    <div className="result-item"><span>Custo Total Real (T):</span><span>{formatCurrency(resultado.custoTotalReal)}</span></div>
                    <div className="result-item"><span>Custo Total Dólar (U):</span><span>{formatCurrency(resultado.custoTotalDolar, 'USD')}</span></div>
                    <div className="result-item"><span>Custo Unitário Dólar (X):</span><span>{formatCurrency(resultado.custoUnitarioDolar, 'USD')}</span></div>
                    <div className="result-item"><span>Custo Unitário Real (Z):</span><span>{formatCurrency(resultado.custoUnitarioReal)}</span></div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>

        <footer className="compex-footer">
          <div className="compex-footer-content">
            <span>© {new Date().getFullYear()} Compex Tecnologia LTDA. Todos os direitos reservados.</span>
            <span>R. Dep. Lacerda Franco, 300 – 9º Andar – Pinheiros – São Paulo – SP</span>
            <span>Contato: (11) 3900-9333 | (11) 99933-5913</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
