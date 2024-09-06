const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
require('dotenv').config();
const User = require('./models/User');
const session = require('express-session'); // for managing sessions

// Initialize express app
const app = express();

// Set up multer for parsing multipart/form-data
const upload = multer();

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.json()); // to parse JSON requests
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err.message);
    });


// Set up session management
app.use(session({
    secret: 'your_secret_key', // Change this to a secure secret
    resave: false,
    saveUninitialized: true,
}));

// Serve index.html on the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Function to generate a random 10-digit account number
function generateAccountNumber() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

// Function to generate a random 9-digit routing number
function generateRoutingNumber() {
    return Math.floor(100000000 + Math.random() * 900000000).toString();
}

// Route to handle form submission with multer for form parsing

app.post('/submit_form', upload.none(), async (req, res) => {
    try {
        console.log("Form Data Received:", req.body);

        let accounts = req.body.accounts ? req.body.accounts.map(acc => {
            let account = JSON.parse(acc);
            account.accountNumber = generateAccountNumber();
            account.routingNumber = generateRoutingNumber();
            account.firstDeposit = account.firstDeposit;  // Initialize firstDeposit if it's undefined
            account.activities = []; // Ensure activities array is initialized
            return account;
        }) : [];

        const userExists = await User.findOne({ emailAddress: req.body.emailAddress });

        if (userExists) {
            if (userExists.accounts.length + accounts.length > 3) {
                throw new Error('A user can only have up to three accounts.');
            } else {
                for (const account of accounts) {
                    // Create and save AccountActivity only once
                    const newActivity = new AccountActivity({
                        accountType: account.type,
                        date: new Date(),
                        description: 'Account Opening',
                        amount: account.firstDeposit,
                        balance: account.firstDeposit,
                        userId: userExists._id
                    });

                    await newActivity.save();
                    account.activities.push(newActivity._id);
                }
                userExists.accounts.push(...accounts);
                await userExists.save();
            }
        } else {
            const newUser = new User({
                firstName: req.body.firstName,
                middleName: req.body.middleName,
                lastName: req.body.lastName,
                dob: req.body.dob,
                addressLine: req.body.addressLine,
                city: req.body.city,
                state: req.body.state,
                zipCode: req.body.zipCode,
                county: req.body.county,
                phoneNumber: req.body.phoneNumber,
                emailAddress: req.body.emailAddress,
                ssn: req.body.ssn,
                employmentStatus: req.body.employmentStatus,
                sourceOfIncome: req.body.sourceOfIncome,
                username: req.body.username,
                password: req.body.password,
                accounts: accounts // Use the initialized accounts array
            });

            await newUser.save();

            // After saving the user, save the activities
            for (const account of accounts) {
                const newActivity = new AccountActivity({
                    accountType: account.type,
                    date: new Date(),
                    description: 'Account Opening',
                    amount: account.firstDeposit,
                    balance: account.firstDeposit,
                    userId: newUser._id
                });

                await newActivity.save();
                account.activities.push(newActivity._id);
            }

            await newUser.save(); // Save the updated user with activity references
            console.log("New User Created:", newUser);
        }

        res.json({ success: true, message: 'Account successfully created!' });
    } catch (error) {
        console.error("Error during form submission:", error.message);
        res.status(400).json({ success: false, message: error.message });
    }
});



// Route to handle login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username: username, password: password });

        if (user) {
            req.session.user = user;
            res.redirect('/accountpage');
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error("Error during login:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Middleware to prevent caching of accountpage.html
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});


// Serve account page if user is authenticated
app.get('/accountpage', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/signin.html');
    }
    
    res.sendFile(path.join(__dirname, 'frontend', 'accountpage.html'));
});

// New route to fetch user's first name
app.get('/getUserFirstName', (req, res) => {
    if (req.session.user) {
        res.json({ firstName: req.session.user.firstName });
    } else {
        res.status(401).json({ error: 'Not logged in' });
    }
});

// Route to handle logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to logout' });
        }
        res.redirect('/signin.html');
    });
});

// New route to fetch user's profile data
app.get('/getUserProfile', (req, res) => {
    if (req.session.user) {
        const { firstName, middleName, lastName, username, password, addressLine, city, state, zipCode } = req.session.user;
        res.json({
            username,
            password: '********', // Hide actual password for security
            fullName: `${firstName} ${middleName ? middleName : ''} ${lastName}`,
            address: addressLine,
            city,
            state,
            zipCode
        });
    } else {
        res.status(401).json({ error: 'Not logged in' });
    }
});


// New route to fetch user's accounts and their balances
app.get('/getUserAccounts', (req, res) => {
    if (req.session.user) {
        const { accounts } = req.session.user;
        res.json(accounts);
    } else {
        res.status(401).json({ error: 'Not logged in' });
    }
});

const AccountActivity = require('./models/AccountActivity');

app.post('/makeDeposit', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const { depositTo, depositAmount } = req.body;
    const user = await User.findById(req.session.user._id);

    const account = user.accounts.find(acc => acc.type === depositTo);
    if (!account) {
        return res.status(400).json({ error: 'Invalid account' });
    }

    account.firstDeposit += parseFloat(depositAmount);

    // Create a new AccountActivity entry
    const newActivity = new AccountActivity({
        accountType: depositTo,
        date: new Date(),
        description: 'Deposit',
        amount: parseFloat(depositAmount),
        balance: account.firstDeposit,
        userId: user._id
    });

    await newActivity.save();
    account.activities.push(newActivity._id);
    await user.save();

    req.session.user = user; // Update session data

    res.json({ success: true, updatedAccount: account });
});


app.get('/getAccountActivity', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const { accountType } = req.query;
    try {
        const activities = await AccountActivity.find({ userId: req.session.user._id, accountType }).sort({ date: -1 });
        res.json(activities);
    } catch (error) {
        console.error('Error fetching account activities:', error);
        res.status(500).json({ error: 'Failed to fetch account activities' });
    }
});


app.delete('/deleteAccountActivity/:id', async (req, res) => {
    try {
        const activityId = req.params.id;
        const activity = await AccountActivity.findById(activityId);
        
        if (!activity) {
            return res.status(404).json({ success: false, message: 'Activity not found' });
        }

        await activity.remove();

        // Update the user's account to remove the reference to the deleted activity
        await User.updateOne(
            { _id: activity.userId, 'accounts.activities': activityId },
            { $pull: { 'accounts.$.activities': activityId } }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting activity:', error);
        res.status(500).json({ success: false, message: 'Failed to delete activity' });
    }
});


app.post('/updateCheckingBalance', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const { totalPrice } = req.body;
    try {
        const user = await User.findById(req.session.user._id);

        const checkingAccount = user.accounts.find(acc => acc.type === 'checking');
        if (!checkingAccount) {
            return res.status(400).json({ error: 'No checking account found' });
        }

        if (checkingAccount.firstDeposit < totalPrice) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Deduct the total price from the balance
        checkingAccount.firstDeposit -= totalPrice;

        // Create a new AccountActivity entry for the shopping
        const newActivity = new AccountActivity({
            accountType: 'checking',
            date: new Date(),
            description: 'Shopping',
            amount: -totalPrice,
            balance: checkingAccount.firstDeposit,
            userId: user._id
        });

        await newActivity.save();  // Save the new activity to the database
        checkingAccount.activities.push(newActivity._id); // Link the activity to the account

        // Save the updated user data
        await user.save();

        // Update the session data
        req.session.user = user;

        res.json({ success: true, newBalance: checkingAccount.firstDeposit, newActivity });
    } catch (error) {
        console.error('Error updating balance or creating activity:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});





app.post('/makeTransfer', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    

    const { transferFrom, transferTo, amount } = req.body;

    console.log('Transfer From:', transferFrom);
    console.log('Transfer To:', transferTo);
    console.log('Amount:', amount);



    // Ensure the amount is a valid number
    const transferAmount = parseFloat(amount);

    if (isNaN(transferAmount) || transferAmount <= 0) {
        return res.status(400).json({ error: 'Invalid transfer amount' });
    }

    const user = await User.findById(req.session.user._id);

    const fromAccount = user.accounts.find(acc => acc.type === transferFrom);
    const toAccount = user.accounts.find(acc => acc.type === transferTo);

    if (!fromAccount || !toAccount) {
        return res.status(400).json({ error: 'Invalid accounts selected' });
    }

    if (fromAccount.firstDeposit < transferAmount) {
        return res.status(400).json({ error: 'Insufficient balance in the "Transfer From" account' });
    }

    // Update the balances
    fromAccount.firstDeposit -= transferAmount;
    toAccount.firstDeposit += transferAmount;

    // Create account activity entries
    const fromActivity = new AccountActivity({
        accountType: transferFrom,
        date: new Date(),
        description: `Transfer to ${transferTo}`,
        amount: -transferAmount,
        balance: fromAccount.firstDeposit,
        userId: user._id
    });

    const toActivity = new AccountActivity({
        accountType: transferTo,
        date: new Date(),
        description: `Transfer from ${transferFrom}`,
        amount: transferAmount,
        balance: toAccount.firstDeposit,
        userId: user._id
    });

    await fromActivity.save();
    await toActivity.save();

    fromAccount.activities.push(fromActivity._id);
    toAccount.activities.push(toActivity._id);

    await user.save();
    req.session.user = user; // Update session data

    res.json({
        success: true,
        updatedFromAccount: fromAccount,
        updatedToAccount: toAccount
    });
});


app.get('/getAccountTransfers', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const { accountType } = req.query;
    try {
        const transfers = await AccountActivity.find({ userId: req.session.user._id, accountType, description: { $regex: /Transfer/ } }).sort({ date: -1 });
        res.json(transfers);
    } catch (error) {
        console.error('Error fetching transfers:', error);
        res.status(500).json({ error: 'Failed to fetch transfers' });
    }
});

app.post('/makePayment', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const { payFrom, amount } = req.body;
    const user = await User.findById(req.session.user._id);

    const account = user.accounts.find(acc => acc.type === payFrom);

    if (!account) {
        return res.status(400).json({ error: 'Invalid account' });
    }

    if (account.firstDeposit < amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Subtract the payment amount from the balance
    account.firstDeposit -= amount;

    // Create a new AccountActivity entry for the bill payment
    const newActivity = new AccountActivity({
        accountType: payFrom,
        date: new Date(),
        description: 'Bill Payment',
        amount: -amount,  // Negative amount for payment
        balance: account.firstDeposit,
        userId: user._id
    });

    await newActivity.save();  // Save the new activity to the database
    account.activities.push(newActivity._id); // Link the activity to the account

    // Save the updated user data
    await user.save();

    req.session.user = user; // Update session data

    res.json({
        success: true,
        updatedAccount: account
    });
});


app.get('/getAccountBills', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const { accountType } = req.query;
    try {
        const bills = await AccountActivity.find({
            userId: req.session.user._id,
            accountType,
            description: { $regex: /Bill Payment/ }
        }).sort({ date: -1 });

        res.json(bills);
    } catch (error) {
        console.error('Error fetching bills:', error);
        res.status(500).json({ error: 'Failed to fetch bills' });
    }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
