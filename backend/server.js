const express = require('express');
const cors = require('cors');
const app = express();
const connectDB = require('./config/db');
const route = require('./src/routes/index');
require('dotenv').config();
const PORT = process.env.PORT || 9999;
connectDB();

app.use(cors());
app.use(express.json());
app.use('/api', route);

app.get('/', (req, res) => {
    try {
        res.send('Hello World!')
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
});


app.listen(PORT, () => console.log(`Server is running at http://localhost:${PORT}`)
)
