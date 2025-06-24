const express = require('express');
const app = express();

app.get('/DocumentManager', (req, res) => {
  res.json({
    status: 'S',
    message: 'Mocked: Loan document processed successfully.'
  });
});

const PORT = 1001; // 👈 Use a different port
app.listen(PORT, () => {
  console.log(`✅ Mock DocumentManager server is running at http://localhost:${PORT}`);
});


