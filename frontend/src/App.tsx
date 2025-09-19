import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

interface DadosCalculadora {
  frete: number;
  vmle: number;
  taxaDolar: number;
  seguro: number;
  quantidade: number;
  aliqII: number;
  aliqIPI: number;
  aliqPIS: number;
  aliqCOFINS: number;
  aliqPISCred: number;
  aliqCOFINSCred: number;
  aliqICMS: number;
  despesasAcessorias: number;
  despesasAduaneiras: number;
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

const API_BASE_URL = 'http://localhost:5000/api';

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

  const handleInputChange = (campo: keyof DadosCalculadora, valor: string) => {
    const numeroValor = parseFloat(valor) || 0;
    setDados(prev => ({ ...prev, [campo]: numeroValor }));
  };

  const calcular = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/calcular`, dados);
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
                    <input type="number" step="0.01" value={dados.frete} onChange={(e) => handleInputChange('frete', e.target.value)} />
                  </label>
                  <label>
                    VMLE (B):
                    <input type="number" step="0.01" value={dados.vmle} onChange={(e) => handleInputChange('vmle', e.target.value)} />
                  </label>
                </div>
              </div>

              <div className="input-group">
                <h3>Parâmetros Fiscais</h3>
                <div className="form-row">
                  <label>
                    Taxa do Dólar (C):
                    <input type="number" step="0.0001" value={dados.taxaDolar} onChange={(e) => handleInputChange('taxaDolar', e.target.value)} />
                  </label>
                  <label>
                    Seguro (E) - BRL:
                    <input type="number" step="0.01" value={dados.seguro} onChange={(e) => handleInputChange('seguro', e.target.value)} />
                  </label>
                  <label>
                    Quantidade (V):
                    <input type="number" value={dados.quantidade} onChange={(e) => handleInputChange('quantidade', e.target.value)} />
                  </label>
                </div>
              </div>

              <div className="input-group">
                <h3>Alíquotas de Impostos (%)</h3>
                <div className="form-row">
                  <label>II: <input type="number" step="0.01" value={dados.aliqII} onChange={(e) => handleInputChange('aliqII', e.target.value)} /></label>
                  <label>IPI: <input type="number" step="0.01" value={dados.aliqIPI} onChange={(e) => handleInputChange('aliqIPI', e.target.value)} /></label>
                  <label>PIS: <input type="number" step="0.01" value={dados.aliqPIS} onChange={(e) => handleInputChange('aliqPIS', e.target.value)} /></label>
                  <label>COFINS: <input type="number" step="0.01" value={dados.aliqCOFINS} onChange={(e) => handleInputChange('aliqCOFINS', e.target.value)} /></label>
                </div>
                <div className="form-row">
                  <label>PIS Crédito: <input type="number" step="0.01" value={dados.aliqPISCred} onChange={(e) => handleInputChange('aliqPISCred', e.target.value)} /></label>
                  <label>COFINS Crédito: <input type="number" step="0.01" value={dados.aliqCOFINSCred} onChange={(e) => handleInputChange('aliqCOFINSCred', e.target.value)} /></label>
                  <label>ICMS: <input type="number" step="0.01" value={dados.aliqICMS} onChange={(e) => handleInputChange('aliqICMS', e.target.value)} /></label>
                </div>
              </div>

              <div className="input-group">
                <h3>Despesas (BRL)</h3>
                <div className="form-row">
                  <label>
                    Despesas Acessórias (N):
                    <input type="number" step="0.01" value={dados.despesasAcessorias} onChange={(e) => handleInputChange('despesasAcessorias', e.target.value)} />
                  </label>
                  <label>
                    Despesas Aduaneiras (R):
                    <input type="number" step="0.01" value={dados.despesasAduaneiras} onChange={(e) => handleInputChange('despesasAduaneiras', e.target.value)} />
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
