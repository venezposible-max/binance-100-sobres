const axios = require('axios');

export default async function handler(req, res) {
    const { JSONBIN_API_KEY, JSONBIN_BIN_ID } = process.env;

    if (!JSONBIN_API_KEY || !JSONBIN_BIN_ID) {
        return res.status(500).json({ error: 'Falta configurar JSONBIN en las variables de entorno de Vercel.' });
    }

    const binUrl = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

    try {
        if (req.method === 'GET') {
            // Leer progreso
            const response = await axios.get(binUrl, {
                headers: { 'X-Master-Key': JSONBIN_API_KEY }
            });
            return res.status(200).json(response.data.record);
        } 
        
        else if (req.method === 'POST') {
            // Actualizar progreso
            const { envelopeId, completed } = req.body;
            
            // Primero obtenemos la info actual
            const currentDataRes = await axios.get(binUrl, {
                headers: { 'X-Master-Key': JSONBIN_API_KEY }
            });
            const data = currentDataRes.data.record;
            
            // Modificamos
            data[envelopeId] = completed;
            
            // Guardamos
            await axios.put(binUrl, data, {
                headers: { 
                    'X-Master-Key': JSONBIN_API_KEY,
                    'Content-Type': 'application/json'
                }
            });
            
            return res.status(200).json({ success: true, data });
        }
        
        else {
            res.setHeader('Allow', ['GET', 'POST']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('JSONBin Error:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Error comunicándose con la base de datos en la nube.' });
    }
}
