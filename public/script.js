let charts = {}; // Objet pour stocker les graphiques

// Fonction pour afficher le résumé des tokens
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

// Fonction pour basculer entre le mode clair et sombre
function toggleMode() {
    const body = document.body;
    body.classList.toggle('black-and-white');

    const button = document.getElementById('toggleButton');
    const isBlackAndWhite = body.classList.contains('black-and-white');

    button.innerText = isBlackAndWhite ? 'Mode Clair' : 'Mode Sombre';
}

// Fonction pour créer un graphique
function createChart(ctx, label, data, color) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: label,
            datasets: [{
                label: 'Prix',
                data: data,
                borderColor: color,
                fill: false,
                tension: 0.1
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
                        text: 'Date'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Prix (USD)'
                    }
                }
            }
        }
    });
}

// Fonction pour afficher les tokens un par un
function showTokensSequentially() {
    const tokens = ['bitcoin', 'ethereum', 'ripple'];
    tokens.forEach((token, index) => {
        const tokenElement = document.getElementById(token);
        setTimeout(() => {
            tokenElement.classList.remove('hidden');
            tokenElement.classList.add('show');
        }, index * 500); // Ajoute 500ms de délai pour chaque token
    });
}

// Fonction pour afficher les graphiques un par un
function showChartsSequentially() {
    const tokens = ['bitcoin', 'ethereum', 'ripple'];
    tokens.forEach((token, index) => {
        setTimeout(() => {
            const ctx = document.getElementById(`${token}Chart`).getContext('2d');
            createChartForToken(token, ctx);
            document.getElementById(`${token}Chart`).classList.remove('hidden');
            document.getElementById(`${token}Chart`).classList.add('show');
        }, index * 1000); // Ajoute 1000ms de délai pour chaque graphique
    });
}

// Fonction pour créer les graphiques par token
async function createChartForToken(token, ctx) {
    const endDate = Math.floor(Date.now() / 1000); // Temps actuel en secondes
    const startDate = endDate - (60 * 60 * 24 * 60); // 60 jours en secondes

    const proxyUrl = 'https://cryptoast-server.netlify.app/api/proxy?url='; // URL de ton proxy local
    const apiUrl = encodeURIComponent(`https://api.coingecko.com/api/v3/coins/${token}/market_chart/range?vs_currency=usd&from=${startDate}&to=${endDate}`);

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

        createChart(ctx, labels, values, token === 'bitcoin' ? 'orange' : token === 'ethereum' ? 'blue' : 'green');
    } catch (error) {
        console.error(`Erreur lors de la récupération des données pour ${token}:`, error);
    }
}

// Récupérer les données historiques pour les graphiques
async function fetchHistoricalData() {
    const tokens = ['bitcoin', 'ethereum', 'ripple'];
    const endDate = Math.floor(Date.now() / 1000); // Temps actuel en secondes
    const startDate = endDate - (60 * 60 * 24 * 60); // 60 jours en secondes

    const proxyUrl = 'https://cryptoast-server.netlify.app/api/proxy?url='; // URL de ton proxy local

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
            createChart(ctx, labels, values, token === 'bitcoin' ? 'orange' : token === 'ethereum' ? 'blue' : 'green');
        } catch (error) {
            console.error(`Erreur lors de la récupération des données pour ${token}:`, error);
        }
    });

    // Attendre que toutes les promesses soient terminées
    await Promise.all(promises);
}

// Charger les données historiques lors du chargement de la page
window.onload = function() {
    // D'abord, montrer les tokens
    showTokensSequentially();

    // Ensuite, après un petit délai, montrer les graphiques
    setTimeout(() => {
        showChartsSequentially();
    }, 1000); // Attends 2 secondes après l'affichage des tokens avant de montrer les graphiques

    // Actualisation des données toutes les 60 secondes
    setInterval(fetchHistoricalData, 60000); // 60000 millisecondes = 1 minute
};
