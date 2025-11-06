// Configurações e Constantes
const API_KEY = 'sua-chave-api-aqui'; // Substitua por sua chave da ExchangeRate-API
const BASE_URL = 'https://api.exchangerate-api.com/v4/latest/';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em milissegundos

// Estado da Aplicação
let exchangeRates = {};
let lastUpdate = null;
let conversionHistory = JSON.parse(localStorage.getItem('conversionHistory')) || [];

// Elementos DOM
const elements = {
    amount: document.getElementById('amount'),
    fromCurrency: document.getElementById('fromCurrency'),
    toCurrency: document.getElementById('toCurrency'),
    result: document.getElementById('result'),
    fromSymbol: document.getElementById('fromSymbol'),
    toSymbol: document.getElementById('toSymbol'),
    convertBtn: document.getElementById('convertBtn'),
    swapCurrencies: document.getElementById('swapCurrencies'),
    rateText: document.getElementById('rateText'),
    lastUpdate: document.getElementById('lastUpdate'),
    ratesGrid: document.getElementById('ratesGrid'),
    historyList: document.getElementById('historyList'),
    clearHistory: document.getElementById('clearHistory'),
    loadingOverlay: document.getElementById('loadingOverlay')
};

// Símbolos das moedas
const currencySymbols = {
    BRL: 'R$',
    USD: 'US$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'CHF',
    CNY: '¥',
    ARS: '$'
};

// Nomes das moedas
const currencyNames = {
    BRL: 'Real Brasileiro',
    USD: 'Dólar Americano',
    EUR: 'Euro',
    GBP: 'Libra Esterlina',
    JPY: 'Iene Japonês',
    CAD: 'Dólar Canadense',
    AUD: 'Dólar Australiano',
    CHF: 'Franco Suíço',
    CNY: 'Yuan Chinês',
    ARS: 'Peso Argentino'
};

// Inicialização da Aplicação
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    showLoading();
    
    // Carrega taxas de câmbio
    await loadExchangeRates('USD');
    
    // Configura event listeners
    setupEventListeners();
    
    // Atualiza interface
    updateCurrencySymbols();
    updateConversionResult();
    updateRatesGrid();
    updateHistoryList();
    updateLastUpdateTime();
    
    hideLoading();
}

// Configuração de Event Listeners
function setupEventListeners() {
    elements.amount.addEventListener('input', updateConversionResult);
    elements.fromCurrency.addEventListener('change', handleFromCurrencyChange);
    elements.toCurrency.addEventListener('change', updateConversionResult);
    elements.convertBtn.addEventListener('click', performConversion);
    elements.swapCurrencies.addEventListener('click', swapCurrencies);
    elements.clearHistory.addEventListener('click', clearHistory);
    
    // Enter para converter
    elements.amount.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performConversion();
        }
    });
}

// Carregamento de Taxas de Câmbio
async function loadExchangeRates(baseCurrency = 'USD') {
    const cacheKey = `exchangeRates_${baseCurrency}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
        exchangeRates = cachedData.rates;
        lastUpdate = cachedData.timestamp;
        return;
    }
    
    try {
        // Para demonstração, usando dados mockados
        // Em produção, substitua pela API real
        const response = await fetch(`${BASE_URL}${baseCurrency}`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar taxas de câmbio');
        }
        
        const data = await response.json();
        exchangeRates = data.rates;
        lastUpdate = Date.now();
        
        // Cache dos dados
        setCachedData(cacheKey, {
            rates: exchangeRates,
            timestamp: lastUpdate
        });
        
    } catch (error) {
        console.error('Erro ao carregar taxas:', error);
        // Fallback para dados mockados
        loadMockExchangeRates(baseCurrency);
    }
}

// Dados Mockados para Demonstração
function loadMockExchangeRates(baseCurrency) {
    const mockRates = {
        USD: { BRL: 5.20, EUR: 0.85, GBP: 0.73, JPY: 110.50, CAD: 1.25, AUD: 1.35, CHF: 0.92, CNY: 6.45, ARS: 98.30 },
        BRL: { USD: 0.19, EUR: 0.16, GBP: 0.14, JPY: 21.25, CAD: 0.24, AUD: 0.26, CHF: 0.18, CNY: 1.24, ARS: 18.90 },
        EUR: { USD: 1.18, BRL: 6.15, GBP: 0.86, JPY: 130.00, CAD: 1.47, AUD: 1.59, CHF: 1.08, CNY: 7.59, ARS: 115.65 },
        GBP: { USD: 1.37, BRL: 7.12, EUR: 1.16, JPY: 151.37, CAD: 1.71, AUD: 1.85, CHF: 1.26, CNY: 8.82, ARS: 134.57 },
        JPY: { USD: 0.0090, BRL: 0.047, EUR: 0.0077, GBP: 0.0066, CAD: 0.0113, AUD: 0.0122, CHF: 0.0083, CNY: 0.058, ARS: 0.89 }
    };
    
    // Preenche rates faltantes com valores calculados
    exchangeRates = mockRates[baseCurrency] || mockRates.USD;
    lastUpdate = Date.now();
}

// Cache de Dados
function getCachedData(key) {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    if (Date.now() - data.timestamp > CACHE_DURATION) {
        localStorage.removeItem(key);
        return null;
    }
    
    return data;
}

function setCachedData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Conversão de Moedas
function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
        return amount;
    }

    // Se a taxa base for diferente da moeda de origem, converte para a base primeiro
    const rateFrom = exchangeRates[fromCurrency];
    const rateTo = exchangeRates[toCurrency];

    if (!rateFrom || !rateTo) {
        console.warn(`Taxas faltando para ${fromCurrency} ou ${toCurrency}`);
        return 0;
    }

    // Valor em relação à moeda base (ex: USD)
    const amountInBase = amount / rateFrom;
    const convertedAmount = amountInBase * rateTo;

    return convertedAmount;
}


// Atualização da Interface
function updateConversionResult() {
    const amount = parseFloat(elements.amount.value) || 0;
    const fromCurrency = elements.fromCurrency.value;
    const toCurrency = elements.toCurrency.value;
    
    const convertedAmount = convertCurrency(amount, fromCurrency, toCurrency);
    
    elements.result.value = formatCurrency(convertedAmount, toCurrency);
    updateRateText(amount, fromCurrency, toCurrency, convertedAmount);
}

function updateRateText(amount, fromCurrency, toCurrency, convertedAmount) {
    const rate = convertedAmount / amount;
    elements.rateText.textContent = `Taxa de câmbio: 1 ${fromCurrency} = ${formatCurrency(rate, toCurrency)} ${toCurrency}`;
}

function updateCurrencySymbols() {
    const fromCurrency = elements.fromCurrency.value;
    const toCurrency = elements.toCurrency.value;
    
    elements.fromSymbol.textContent = currencySymbols[fromCurrency] || fromCurrency;
    elements.toSymbol.textContent = currencySymbols[toCurrency] || toCurrency;
}

function updateLastUpdateTime() {
    if (lastUpdate) {
        const date = new Date(lastUpdate);
        elements.lastUpdate.textContent = `Atualizado: ${date.toLocaleTimeString()}`;
    }
}

// Grid de Taxas
function updateRatesGrid() {
    const baseCurrency = elements.fromCurrency.value;
    const ratesToShow = ['USD', 'EUR', 'GBP', 'JPY', 'BRL', 'CAD', 'AUD'].filter(currency => currency !== baseCurrency);
    
    elements.ratesGrid.innerHTML = ratesToShow.map(currency => {
        const rate = convertCurrency(1, baseCurrency, currency);
        return `
            <div class="rate-item">
                <span class="rate-currency">1 ${baseCurrency}</span>
                <span class="rate-value">${formatCurrency(rate, currency)}</span>
            </div>
        `;
    }).join('');
}

// Histórico de Conversões
function addToHistory(amount, fromCurrency, toCurrency, result) {
    const conversion = {
        id: Date.now(),
        amount: amount,
        fromCurrency: fromCurrency,
        toCurrency: toCurrency,
        result: result,
        rate: result / amount,
        timestamp: new Date().toISOString()
    };
    
    conversionHistory.unshift(conversion);
    
    // Mantém apenas os últimos 10 itens
    if (conversionHistory.length > 10) {
        conversionHistory = conversionHistory.slice(0, 10);
    }
    
    localStorage.setItem('conversionHistory', JSON.stringify(conversionHistory));
    updateHistoryList();
}

function updateHistoryList(forceEmpty = false) {
    if (conversionHistory.length === 0 || forceEmpty) {
        elements.historyList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #6b7280;">
                <i class="fas fa-history" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Nenhuma conversão realizada ainda</p>
            </div>
        `;
        return;
    }
    
    elements.historyList.innerHTML = conversionHistory.map(conversion => `
        <div class="history-item">
            <div class="history-details">
                <div class="history-amount">
                    ${formatCurrency(conversion.amount, conversion.fromCurrency)} → 
                    ${formatCurrency(conversion.result, conversion.toCurrency)}
                </div>
                <div class="history-rate">
                    Taxa: 1 ${conversion.fromCurrency} = ${formatCurrency(conversion.rate, conversion.toCurrency)}
                </div>
            </div>
            <div class="history-date">
                ${new Date(conversion.timestamp).toLocaleTimeString()}
            </div>
        </div>
    `).join('');
}


function clearHistory() {
    if (confirm('Tem certeza que deseja limpar o histórico de conversões?')) {
        conversionHistory = [];
        localStorage.removeItem('conversionHistory');
        updateHistoryList();
    }
}

// Ações do Usuário
async function performConversion() {
    const amount = parseFloat(elements.amount.value);
    
    if (!amount || amount <= 0) {
        alert('Por favor, insira um valor válido maior que zero.');
        elements.amount.focus();
        return;
    }
    
    const fromCurrency = elements.fromCurrency.value;
    const toCurrency = elements.toCurrency.value;
    const result = parseFloat(elements.result.value.replace(/[^\d.,]/g, '').replace(',', '.'));
    
    addToHistory(amount, fromCurrency, toCurrency, result);
    
    // Efeito visual de confirmação
    elements.convertBtn.innerHTML = '<i class="fas fa-check"></i> Convertido!';
    elements.convertBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    
    setTimeout(() => {
        elements.convertBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Converter';
        elements.convertBtn.style.background = '';
    }, 2000);
}

async function handleFromCurrencyChange() {
    showLoading();
    await loadExchangeRates(elements.fromCurrency.value);
    updateCurrencySymbols();
    updateConversionResult();
    updateRatesGrid();
    updateLastUpdateTime();
    hideLoading();
}

function swapCurrencies() {
    const fromCurrency = elements.fromCurrency.value;
    const toCurrency = elements.toCurrency.value;
    
    elements.fromCurrency.value = toCurrency;
    elements.toCurrency.value = fromCurrency;
    
    updateCurrencySymbols();
    updateConversionResult();
    updateRatesGrid();
}

// Utilitários
function formatCurrency(amount, currency) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function showLoading() {
    elements.loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    elements.loadingOverlay.style.display = 'none';
}

// Prevenção de valores negativos
elements.amount.addEventListener('blur', function() {
    if (this.value && parseFloat(this.value) < 0) {
        this.value = Math.abs(parseFloat(this.value)).toFixed(2);
        updateConversionResult();
    }
});

// Atualização em tempo real com debounce
let timeoutId;
elements.amount.addEventListener('input', function() {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(updateConversionResult, 300);
});

// Service Worker para cache 
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registrado com sucesso: ', registration.scope);
            })
            .catch(function(error) {
                console.log('Falha no registro do ServiceWorker: ', error);
            });
    });
}