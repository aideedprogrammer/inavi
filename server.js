const express = require('express');
const path = require('path');
const session = require('express-session');
const morgan = require('morgan');

const app = express();
const PORT = 3000;

// ✅ Session middleware
app.use(session({
  secret: 'inavigator_secret_key',   // Change to something secure in production
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
}));

// ✅ Request logger
app.use(morgan('dev'));

// ✅ Parse request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Static files from "public"
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Serve tile folders under /tiles/:name/{z}/{x}/{y}.png
app.use('/tiles', express.static(path.join(__dirname, 'public')));

// ✅ Import user model
const userModel = require('./models/userModel');
const chartModel = require('./models/chartModel');

// ✅ Auto-create table + sample users
(async () => {
  // await chartModel.dropAndCreateTable();
  // await userModel.dropAndCreateTable();
  // await userModel.insertUser({ name: 'Zamani Aman', role: 'Admin', username: 'zamani', password: '12345' });
  // await userModel.insertUser({ name: 'Ali User', role: 'User', username: 'ali', password: 'abc123' });
})();

// ✅ Auth middleware: if not logged in, show login.html
function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }
}

// ✅ Home page (protected)
app.get('/', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'demo.html'));
});

// ✅ Login page (manually visit /login)
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ✅ Handle login
app.post('/login_auth', async (req, res) => {
  const { username, password } = req.body;
  const user = await userModel.validateLogin(username, password);

  if (user) {
    // Store session
    req.session.user = {
      id: user.id,
      name: user.name,
      role: user.role,
      username: user.username
    };

    // Redirect based on role
    if (user.role === 'Admin') {
      res.json({ success: true, redirect: '/main.html' });
    } else {
      res.json({ success: true, redirect: '/' });
    }
  } else {
    res.json({ success: false, message: "Invalid username or password." });
  }
});

app.get('/user_info', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ success: true, name: req.session.user.name, role: req.session.user.role });
  } else {
    res.json({ success: false });
  }
});

app.get('/api/users', requireLogin, async (req, res) => {
  const allUsers = await userModel.getAllUsers();
  res.json({ users: allUsers });
});

app.post('/api/users', requireLogin, async (req, res) => {
  const { name, role, username, password } = req.body;
  const id = await userModel.addUser({ name, role, username, password });
  res.json({ success: true, id });
});

// ✅ Update user
app.put('/api/users/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  const { name, role, username, password } = req.body;

  if (password) {
    await userModel.updateUser(id, { name, role, username, password });
  } else {
    await userModel.updateUserWithoutPassword(id, { name, role, username });
  }

  res.json({ success: true });
});

// ✅ Delete user
app.delete('/api/users/:id', requireLogin, async (req, res) => {
  const id = req.params.id;
  await userModel.deleteUser(id);
  res.json({ success: true });
});

// ✅ Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// ✅ reset password
app.put('/api/users/:id/reset-password', requireLogin, async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  await userModel.resetPassword(id, password);
  res.json({ success: true });
});

// for chart
app.post('/api/chart', requireLogin, async (req, res) => {
  try {
    const { infoChart, createdBy, updatedBy, ownerBy } = req.body;

    // Check if chart for this owner already exists
    const existingCharts = await chartModel.getAllCharts();
    const existing = existingCharts.find(c => c.ownerBy === ownerBy);

    if (existing) {
      // ✅ Update existing chart
      await chartModel.updateChart(existing.id, { infoChart, updatedBy, ownerBy });
      res.json({ success: true, message: 'Chart updated successfully', id: existing.id });
    } else {
      // ✅ Insert new chart
      const id = await chartModel.insertChart({ infoChart, createdBy, updatedBy, ownerBy });
      res.json({ success: true, message: 'Chart created successfully', id });
    }
  } catch (error) {
    console.error('Error saving chart:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


app.get('/api/chart/:ownerBy', requireLogin, async (req, res) => {
  try {
    const ownerBy = req.params.ownerBy;
    const chart = await chartModel.getChartByOwner(ownerBy);

    if (!chart) {
      return res.status(404).json({ success: false, message: 'Chart not found' });
    }

    res.json({ success: true, chart });
  } catch (error) {
    console.error('Error fetching chart:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
