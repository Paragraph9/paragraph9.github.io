// netlify/functions/gemini-proxy.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { prompt } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY; // Access the secret environment variable

    if (!apiKey) {
        return { statusCode: 500, body: 'API Key not configured.' };
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    try {
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
        });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.json();
            return {
                statusCode: geminiResponse.status,
                body: JSON.stringify({ message: 'Error from Gemini API', details: errorBody })
            };
        }

        const geminiResult = await geminiResponse.json();
        return {
            statusCode: 200,
            body: JSON.stringify(geminiResult)
        };
    } catch (error) {
        console.error('Proxy function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error in proxy function', details: error.message })
        };
    }
};
