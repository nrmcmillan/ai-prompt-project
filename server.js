import express from 'express';
import bodyParser from 'body-parser';
import generateHandler from './api/generate.js';

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/api/generate', generateHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
