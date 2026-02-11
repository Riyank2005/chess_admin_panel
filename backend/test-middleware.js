import express from 'express';
import { sanitizeInput, xssProtection } from './middleware/security.js';

const app = express();
app.use(express.json());

app.post('/test', sanitizeInput, xssProtection, (req, res) => {
    res.json({ status: 'ok', body: req.body });
});

// Error handler to catch the crash
app.use((err, req, res, next) => {
    console.error('CAUGHT ERROR:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
});

const PORT = 5002;
app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);

    // Self-test
    fetch(`http://localhost:${PORT}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'test.key': 'value', 'script': '<script>alert(1)</script>' })
    })
        .then(res => res.json())
        .then(data => {
            console.log('RESPONSE:', JSON.stringify(data, null, 2));
            process.exit(0);
        })
        .catch(err => {
            console.error('FETCH ERROR:', err);
            process.exit(1);
        });
});
