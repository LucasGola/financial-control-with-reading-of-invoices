const express = require('express');
const cors = require('cors');
const flowRoutes = require('./routes/flowRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', flowRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;