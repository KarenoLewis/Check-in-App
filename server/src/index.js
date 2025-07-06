
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

let employees = [];

app.get('/status', (req, res) => {
  res.json(employees);
});

app.post('/clock-in', (req, res) => {
  const { employeeName } = req.body;
  const employee = employees.find(emp => emp.name === employeeName);
  if (employee) {
    employee.status = 'Clocked In';
    employee.lastClockIn = new Date();
  } else {
    employees.push({
      name: employeeName,
      status: 'Clocked In',
      lastClockIn: new Date(),
      lastClockOut: null
    });
  }
  res.json({ message: 'Clocked in successfully' });
});

app.post('/clock-out', (req, res) => {
  const { employeeName } = req.body;
  const employee = employees.find(emp => emp.name === employeeName);
  if (employee) {
    employee.status = 'Clocked Out';
    employee.lastClockOut = new Date();
  }
  res.status(404).json({ message: 'Employee not found' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
