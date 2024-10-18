let charts = {};

// create summary function
function showSummary(token) {
    const allSummaries = document.querySelectorAll('.summary');
    allSummaries.forEach(summary => {
        summary.style.display = 'none';
    });

    const summary = document.getElementById(`summary-${token}`);

    if (token === 'bitcoin') {
        summary.innerHTML = `
            <h3>Bitcoin (BTC)</h3>
            <p>Bitcoin est la première cryptomonnaie, créée en 2009 par une personne ou un groupe de personnes utilisant le pseudonyme Satoshi Nakamoto.</p>
        `;
    } else if (token === 'ethereum') {
        summary.innerHTML = `
            <h3>Ethereum (ETH)</h3>
            <p>Ethereum, lancé en 2015, est une plateforme décentralisée permettant de créer des contrats intelligents et des applications décentralisées (dApps).</p>
        `;
    } else if (token === 'ripple') {
        summary.innerHTML = `
            <h3>Ripple (XRP)</h3>
            <p>Ripple est une plateforme qui vise à faciliter les paiements internationaux rapides et à faible coût.</p>
        `;
    }
    summary.style.display = 'block';
}

// handling black and white mode function
function toggleMode()
{
    const body = document.body;
    body.classList.toggle('black-and-white');
    const button = document.getElementById('toggleButton');
    const isBlackAndWhite = body.classList.contains('black-and-white');
    button.innerText = isBlackAndWhite ? 'Mode Clair' : 'Mode Sombre';
}

// create chart function
function createChart(ctx, label, data, color)
{
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: label,
            datasets: [{
                label: 'Prix',
                data: data,
                borderColor: color,
                fill: false,
                tension: 0.1,
                pointBackgroundColor: color,
                pointBorderColor: color
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date',
                        color: 'black'
                    },
                    ticks: {
                        color: 'black'
                    },
                    grid: {
                        color: 'black'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Prix (USD)',
                        color: 'black'
                    },
                    ticks: {
                        color: 'black'
                    },
                    grid: {
                        color: 'black'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'black'
                    }
                }
            }
        }
    });
}

// display token function
function showTokensSequentially()
{
    const tokens = ['bitcoin', 'ethereum', 'ripple'];
    tokens.forEach((token, index) => {
        const tokenElement = document.getElementById(token);
        setTimeout(() => {
            tokenElement.classList.remove('hidden');
            tokenElement.classList.add('show');
        }, index * 500);
    });
}

// display charts function
function showChartsSequentially()
{
    const tokens = ['bitcoin', 'ethereum', 'ripple'];
    tokens.forEach((token, index) => {
        setTimeout(() => {
            const ctx = document.getElementById(`${token}Chart`).getContext('2d');
            createChartForToken(token, ctx);
            document.getElementById(`${token}Chart`).classList.remove('hidden');
            document.getElementById(`${token}Chart`).classList.add('show');
        }, index * 500);
    });
}

// create charts for each token function
async function createChartForToken(token, ctx)
{
    const endDate = Math.floor(Date.now() / 1000);
    const startDate = endDate - (60 * 60 * 24 * 60); // 60 jours en secondes
    const proxyUrl = 'https://cryptoast-server.netlify.app/api/proxy?url=';
    const apiUrl = encodeURIComponent(`https://api.coingecko.com/api/v3/coins/${token}/market_chart/range?vs_currency=usd&from=${startDate}&to=${endDate}`);

    if (charts[token])
        charts[token].destroy();
    try {
        const response = await fetch(`${proxyUrl}${apiUrl}`);
        const data = await response.json();
        if (!data.prices) {
            console.error(`Pas de données reçues pour ${token}`);
            return;
        }
        const prices = data.prices.map(price => ({
            timestamp: new Date(price[0]).toLocaleDateString(),
            value: price[1]
        }));
        const labels = prices.map(price => price.timestamp);
        const values = prices.map(price => price.value);
        charts[token] = createChart(ctx, labels, values, token === 'bitcoin' ? 'orange' : token === 'ethereum' ? 'blue' : 'green');
    } catch (error) {
        console.error(`Erreur lors de la récupération des données pour ${token}:`, error);
    }
}

// getting stats from coingecko api
async function fetchHistoricalData()
{
    const tokens = ['bitcoin', 'ethereum', 'ripple'];
    const endDate = Math.floor(Date.now() / 1000);
    const startDate = endDate - (60 * 60 * 24 * 60);
    const proxyUrl = 'https://cryptoast-server.netlify.app/api/proxy?url=';
    const promises = tokens.map(async (token) => {
        try {
            const apiUrl = encodeURIComponent(`https://api.coingecko.com/api/v3/coins/${token}/market_chart/range?vs_currency=usd&from=${startDate}&to=${endDate}`);
            const response = await fetch(`${proxyUrl}${apiUrl}`);
            const data = await response.json();
            if (!data.prices) {
                console.error(`Pas de données reçues pour ${token}`);
                return;
            }
            const prices = data.prices.map(price => ({
                timestamp: new Date(price[0]).toLocaleDateString(),
                value: price[1]
            }));
            const labels = prices.map(price => price.timestamp);
            const values = prices.map(price => price.value);
            const ctx = document.getElementById(`${token}Chart`).getContext('2d');
            charts[token] = createChart(ctx, labels, values, token === 'bitcoin' ? 'orange' : token === 'ethereum' ? 'blue' : 'green');
        } catch (error) {
            console.error(`Erreur lors de la récupération des données pour ${token}:`, error);
        }
    });
    await Promise.all(promises);
}

window.onload = function() {
    showTokensSequentially();
    setTimeout(() => {
        showChartsSequentially();
    }, 1500);
    // refresh each min
    setInterval(fetchHistoricalData, 60000);
};
