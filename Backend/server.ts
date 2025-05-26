const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

const allowedOrigins = [
  'http://localhost:4200',
]

app.use(cors({
  origin: function (origin: any, callback: any) {

    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not ' +
        'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: false })); // support encoded bodies

app.get('/', (req: any, res: any) => {
  console.log(req.body);
  console.log('status success');
  res.send('OK');
});

app.get('/api/transactions', (req: any, res: any) => {
  res.send(require('./transactions.json'));
});

app.listen(8080, () => {
  console.log('Express app listening on port 8080!');
});