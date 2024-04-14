const express = require('express');
require("dotenv").config({ override: true });
require('./services/botService');

const app = express();
const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});