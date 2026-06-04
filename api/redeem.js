const axios = require('axios');
const crypto = require('crypto');

function createBinanceSignature(queryString, secret) {
    return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { amount, asset = 'USDT' } = req.body;
    const { BINANCE_API_KEY, BINANCE_API_SECRET } = process.env;
    
    if (!BINANCE_API_KEY || !BINANCE_API_SECRET) {
        return res.status(500).json({ error: 'Credenciales de Binance no configuradas en Vercel.' });
    }
    
    try {
        // 1. Obtener productId del producto Flexible
        const timestamp1 = Date.now();
        let queryStr1 = `asset=${asset}&timestamp=${timestamp1}`;
        const signature1 = createBinanceSignature(queryStr1, BINANCE_API_SECRET);
        
        const listResponse = await axios.get(`https://api.binance.com/sapi/v1/simple-earn/flexible/list?${queryStr1}&signature=${signature1}`, {
            headers: { 'X-MBX-APIKEY': BINANCE_API_KEY }
        });
        
        const products = listResponse.data.rows;
        if (!products || products.length === 0) {
            return res.status(400).json({ error: `No se encontró producto Flexible para ${asset}` });
        }
        
        const productId = products[0].productId;
        
        // 2. Redimir (retirar) el monto del productId
        const timestamp2 = Date.now();
        let queryStr2 = `productId=${productId}&amount=${amount}&timestamp=${timestamp2}`;
        const signature2 = createBinanceSignature(queryStr2, BINANCE_API_SECRET);
        
        const redeemResponse = await axios.post(`https://api.binance.com/sapi/v1/simple-earn/flexible/redeem?${queryStr2}&signature=${signature2}`, null, {
            headers: { 'X-MBX-APIKEY': BINANCE_API_KEY }
        });
        
        return res.status(200).json({ success: true, message: `Retirados ${amount} ${asset} de Earn Flexible a Spot.` });
        
    } catch (error) {
        console.error("Binance Earn API Error:", error.response ? error.response.data : error.message);
        return res.status(500).json({ 
            error: error.response?.data?.msg || 'Error al comunicarse con Binance Earn para el retiro.' 
        });
    }
}
