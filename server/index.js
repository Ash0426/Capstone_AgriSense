const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// 1. INITIALIZE SQLITE DATABASE
const db = new sqlite3.Database('./agrisense.db', (err) => {
    if (err) console.error("Database error: ", err.message);
    else console.log("Connected to local SQLite database.");
});

// Create Users Table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT,
    action TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Helper function to easily log activities
const logActivity = (email, action) => {
    db.run(`INSERT INTO activity_logs (user_email, action) VALUES (?, ?)`, [email, action]);
};

// Create a default admin account for testing (if one doesn't exist)
db.run(`INSERT OR IGNORE INTO users (username, email, password, role) 
        VALUES ('Admin', 'trinove.corp@gmail.com', 'admin123', 'admin')`);

// 2. EMAIL API SETUP (Nodemailer)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'trinove.corp@gmail.com',
        pass: 'tgjuyxopimtatjap' 
    }
});

// 3. LOGIN & OTP ROUTE
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    // Check if user exists in database
    db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password], (err, user) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (!user) return res.status(401).json({ error: "Invalid email or password" });

        // Generate a 4-digit OTP
        const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

        // Save OTP to the database for this user
        db.run(`UPDATE users SET current_otp = ? WHERE id = ?`, [generatedOtp, user.id], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: "Failed to save OTP" });

            // Send the email
            const mailOptions = {
                from: 'AgriSense System',
                to: user.email,
                subject: 'Your AgriSense Login OTP',
                text: `Your One-Time Password is: ${generatedOtp}. Do not share this with anyone.`
            };

            transporter.sendMail(mailOptions, (mailErr, info) => {
                if (mailErr) {
                    console.log(mailErr);
                    return res.status(500).json({ error: "Failed to send email" });
                }
                res.json({ message: "OTP sent successfully to email" });
            });
        });
    });
});

// 4. VERIFY OTP ROUTE
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    // Check if the email and OTP match exactly what is in the database
    db.get(`SELECT * FROM users WHERE email = ? AND current_otp = ?`, [email, otp], (err, user) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (!user) return res.status(401).json({ error: "Invalid OTP code. Please try again." });

        // Security best practice: Clear the OTP from the database so it can't be reused
        db.run(`UPDATE users SET current_otp = NULL WHERE id = ?`, [user.id]);
        
        // Success! Send back the user's role so the app knows if they are an admin
        res.json({ message: "Login successful", role: user.role });
    });
});
// 5. CREATE NEW USER ROUTE (Admin Only)
app.post('/api/create-user', (req, res) => {
    const { username, email, password } = req.body;

    // Make sure no fields are empty
    if (!username || !email || !password) {
        return res.status(400).json({ error: "All fields are required." });
    }

    // Insert the new user into the database (defaulting role to 'user')
    const query = `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')`;
    
    db.run(query, [username, email, password], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: "An account with this email already exists." });
            }
            return res.status(500).json({ error: "Database error. Could not create user." });
        }
        
        logActivity('Admin', 'Created new account: ' + email.trim().toLowerCase());
        
        res.json({ message: `User account for ${email} created successfully!` });
    });
});
// 6. FORGOT PASSWORD - REQUEST RESET OTP
app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email address is required." });

    db.get(`SELECT * FROM users WHERE email = ?`, [email.trim().toLowerCase()], (err, user) => {
        if (err) return res.status(500).json({ error: "Database error." });
        if (!user) return res.status(404).json({ error: "No account found with this email." });

        // Generate a fresh 4-digit verification code
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        db.run(`UPDATE users SET current_otp = ? WHERE id = ?`, [otp, user.id], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: "Database error saving reset code." });

            const mailOptions = {
                from: transporter.options.auth.user,
                to: user.email,
                subject: 'AgriSense - Password Reset Verification',
                text: `Your 4-digit code to reset your AgriSense password is: ${otp}. If you did not request this, please secure your account.`
            };

            transporter.sendMail(mailOptions, (mailErr, info) => {
                if (mailErr) {
                    console.log("Mail Error:", mailErr);
                    return res.status(500).json({ error: "Failed to dispatch email." });
                }
                res.json({ message: "A recovery code has been sent to your email inbox." });
            });
        });
    });
});

// 7. VERIFY RESET OTP & CHANGE PASSWORD
app.post('/api/reset-password', (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: "All fields are required." });
    }

    // Verify the OTP still matches the email record
    db.get(`SELECT * FROM users WHERE email = ? AND current_otp = ?`, [email.trim().toLowerCase(), otp], (err, user) => {
        if (err) return res.status(500).json({ error: "Database error." });
        if (!user) return res.status(401).json({ error: "Invalid verification code. Reset denied." });

        // Update the password column and flush the OTP out for security
        db.run(`UPDATE users SET password = ?, current_otp = NULL WHERE id = ?`, [newPassword, user.id], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: "Failed to overwrite password record." });
            res.json({ message: "Password updated successfully! You can now log in." });
        });
    });
});
// 8. UPDATE PROFILE ROUTE
app.post('/api/update-profile', (req, res) => {
    const { currentEmail, username, email, password } = req.body;

    if (!currentEmail || !username || !email || !password) {
        return res.status(400).json({ error: "All fields are required to update." });
    }

    // Overwrite the user's data where the email matches their current login email
    const query = `UPDATE users SET username = ?, email = ?, password = ? WHERE email = ?`;

    db.run(query, [username.trim(), email.trim().toLowerCase(), password, currentEmail.trim().toLowerCase()], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: "That email is already registered to another account." });
            }
            return res.status(500).json({ error: "Database error. Could not update profile." });
        }
                logActivity(currentEmail.trim().toLowerCase(), 'Updated personal profile info');
        
        res.json({ message: "Profile updated successfully in the database!" });
    });
});

// --- FETCH USERS (Admin Only) ---
app.get('/api/users', (req, res) => {
    db.all(`SELECT id, username, email, password, role FROM users WHERE role = 'user'`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error." });
        res.json(rows);
    });
});

// --- FETCH LOGS ---
app.get('/api/logs', (req, res) => {
    db.all(`SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 50`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error." });
        res.json(rows);
    });
});

// --- REQUEST ADMIN EDIT OTP ---
app.post('/api/request-admin-edit', (req, res) => {
    const { oldEmail } = req.body;
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    db.run(`UPDATE users SET current_otp = ? WHERE email = ?`, [otp, oldEmail.trim().toLowerCase()], (err) => {
        if (err) return res.status(500).json({ error: "Database error." });
        
        const mailOptions = {
            from: transporter.options.auth.user,
            to: oldEmail,
            subject: 'AgriSense - Admin Modification Alert',
            text: `An admin is attempting to modify this account. Verification Code: ${otp}`
        };
        transporter.sendMail(mailOptions);
        res.json({ message: "OTP sent to the user's original email." });
    });
});

// --- VERIFY ADMIN EDIT OTP & SAVE ---
app.post('/api/verify-admin-edit', (req, res) => {
    const { oldEmail, otp, newName, newEmail, newPassword } = req.body;
    db.get(`SELECT * FROM users WHERE email = ? AND current_otp = ?`, [oldEmail.trim().toLowerCase(), otp], (err, user) => {
        if (!user) return res.status(401).json({ error: "Invalid OTP." });
        
        db.run(`UPDATE users SET username = ?, email = ?, password = ?, current_otp = NULL WHERE id = ?`, 
        [newName.trim(), newEmail.trim().toLowerCase(), newPassword, user.id], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: "Failed to update user." });
            logActivity('Admin', `Modified user account: ${oldEmail}`);
            res.json({ message: "User updated successfully!" });
        });
    });
});
// --- FETCH USERS (Admin Only) ---
app.get('/api/users', (req, res) => {
    db.all(`SELECT id, username, email, password, role FROM users WHERE role = 'user'`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error." });
        res.json(rows);
    });
});

// --- FETCH LOGS ---
app.get('/api/logs', (req, res) => {
    db.all(`SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 50`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error." });
        res.json(rows);
    });
});

// --- REQUEST ADMIN EDIT OTP ---
app.post('/api/request-admin-edit', (req, res) => {
    const { oldEmail } = req.body;
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    db.run(`UPDATE users SET current_otp = ? WHERE email = ?`, [otp, oldEmail.trim().toLowerCase()], (err) => {
        if (err) return res.status(500).json({ error: "Database error." });
        
        const mailOptions = {
            from: transporter.options.auth.user,
            to: oldEmail,
            subject: 'AgriSense - Admin Modification Alert',
            text: `An admin is attempting to modify this account. Verification Code: ${otp}`
        };
        transporter.sendMail(mailOptions);
        res.json({ message: "OTP sent to the user's original email." });
    });
});

// --- VERIFY ADMIN EDIT OTP & SAVE ---
app.post('/api/verify-admin-edit', (req, res) => {
    const { oldEmail, otp, newName, newEmail, newPassword } = req.body;
    db.get(`SELECT * FROM users WHERE email = ? AND current_otp = ?`, [oldEmail.trim().toLowerCase(), otp], (err, user) => {
        if (!user) return res.status(401).json({ error: "Invalid OTP." });
        
        db.run(`UPDATE users SET username = ?, email = ?, password = ?, current_otp = NULL WHERE id = ?`, 
        [newName.trim(), newEmail.trim().toLowerCase(), newPassword, user.id], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: "Failed to update user." });
            logActivity('Admin', `Modified user account: ${oldEmail}`);
            res.json({ message: "User updated successfully!" });
        });
    });
});

// Start the server
app.listen(3000, '0.0.0.0', () => {
    console.log('AgriSense Backend Server running on port 3000');
});