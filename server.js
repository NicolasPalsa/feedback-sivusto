// Imports
import express from 'express'
import session from 'express-session'
import mysql from 'mysql2/promise'
import path from 'node:path'
import bcrypt from 'bcrypt'


import config from './config.json' with { type: 'json' }
import dbconfig from './dbconfig.json' with { type: 'json' }
import db from './db.js'
import { fileURLToPath } from 'node:url'

// Lets
let loggedIn = false

// Constants
const { host, port } = config

// Database information
const dbHost = dbconfig.host
const dbName= dbconfig.database
const dbUser = dbconfig.user
const dbPwd = dbconfig.password

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Server configuration
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// Static
app.use(express.urlencoded({extended: true}))
app.use(session({
  secret: "supersecretkey",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(express.static('public'))
app.use('/styles', express.static('public/styles'));


// Functions
function isLoggedIn(req, res, next) {
    if (!loggedIn) {
        return res.redirect('/login')
    } else {
        next()
    }
}

// Paths
app.get('/', isLoggedIn, async (req, res) => {
    res.redirect('users')
})

app.get('/users', isLoggedIn, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection({
        host: dbHost,
        user: dbUser,
        password: dbPwd,
        database: dbName
        });
          
        const rows = await db.getUsers()
        
        res.render('users', { rows: rows, path: req.path })
    }
    catch (err) {
        console.error('Database error: ' + err);
        res.status(500).send('Internal Server Error');
    }
    if (connection) {
        try {
            await connection.end();
        } 
        catch (closeError) {
            console.error('Error closing connection:', closeError);
        }
    }
})

app.get('/support', isLoggedIn, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection({
        host: dbHost,
        user: dbUser,
        password: dbPwd,
        database: dbName
        });
            
        const rows = await db.getSupport()
       
        res.render('support', { rows: rows, path: req.path })
    }
    catch (err) {
        console.error('Database error: ' + err);
        res.status(500).send('Internal Server Error');
    }
    if (connection) {
        try {
            await connection.end();
        } 
        catch (closeError) {
            console.error('Error closing connection:', closeError);
        }
    }
})

app.get('/support_ticket/:id', isLoggedIn, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection({
        host: dbHost,
        user: dbUser,
        password: dbPwd,
        database: dbName
        });
            
        const rows = await db.getSupportMessages(req.params.id)
        res.render('support_ticket', { support: rows.support, messages: rows.messages, ticket_id: req.params.id, path: req.path })
    }
    catch (err) {
        console.error('Database error: ' + err);
        res.status(500).send('Internal Server Error');
    }
    if (connection) {
        try {
            await connection.end();
        } 
        catch (closeError) {
            console.error('Error closing connection:', closeError);
        }
    }
})

app.get('/user_page/:id', isLoggedIn, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection({
        host: dbHost,
        user: dbUser,
        password: dbPwd,
        database: dbName
        });
            
        const row = await db.getUser(req.params.id)
        console.log(row)
        res.render('user_page', { row: row, path: req.path })
    }
    catch (err) {
        console.error('Database error: ' + err);
        res.status(500).send('Internal Server Error');
    }
    if (connection) {
        try {
            await connection.end();
        } 
        catch (closeError) {
            console.error('Error closing connection:', closeError);
        }
    }
})

app.get('/feedback', isLoggedIn, async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection({
        host: dbHost,
        user: dbUser,
        password: dbPwd,
        database: dbName
        });
            
        const rows = await db.getFeedback()
        
        res.render('feedback', { rows: rows, path: req.path })
    }
    catch (err) {
        console.error('Database error: ' + err);
        res.status(500).send('Internal Server Error');
    }
    if (connection) {
        try {
            await connection.end();
        } 
        catch (closeError) {
            console.error('Error closing connection:', closeError);
        }
    }
})

app.get('/login', async (req, res) => {
    req.session.destroy(err => {if (err) throw err})
    loggedIn = false
    res.render('login', { path: req.path })
})

/*app.get('/feedback/:id', async (req, res) => {
    let connection;
    try {
        const id = parseInt(req.params.id);
        connection = await mysql.createConnection({
        host: dbHost,
        user: dbUser,
        password: dbPwd,
        database: dbName,
        });
        
        const rows = await db.getFeedback()
        let fetched = []
        rows.forEach((i) => {
            if (i.id === id) {
                fetched.push(i)
            }
        })
    
        res.render('feedback', { rows: fetched })
    } 
    catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Internal Server Error');
    } 
    finally {
        if (connection) {
        try {
            await connection.end();
        } catch (closeError) {
            console.error('Error closing connection:', closeError);
        }
        }
    }
});*/
app.post('/support_ticket', async (req, res) => {
    if (req.body.ticket_id && req.body.admin_id && req.body.reply) {
        const ticket_id = req.body.ticket_id
        const admin_id = req.body.admin_id
        const reply = req.body.reply

        await db.addMessage(ticket_id, admin_id, reply)

        res.redirect('/support_ticket/' + ticket_id)
    } 
    else if (req.body.ticket_id && req.body.status) {
        const ticket_id = req.body.ticket_id
        const status = req.body.status

        await db.changeTicketStatus(ticket_id, status, )

        res.redirect('/support_ticket/' + ticket_id)
    }
    else {
        console.log('Error in the ticket POST domain');
    }
})

app.post('/user_page', async (req, res) => {
    console.log(req);
    let name = req.body.name
    let email = req.body.email
    let mailing = req.body.mailing_list
    let customer = req.body.customer_id
    let admin = req.body.admin
    let password = req.body.password
    let id = req.body.user_id

    if (customer.length == 0) {
        const user = await db.getUser(id)
        if (user[0].customer_id == null) {
            customer = null
        }
        else {
            customer = user[0].customer_id
        }
    }
    if (mailing.length == 0) mailing = 0
    if (admin.length == 0) admin = 0

    if (email.length == 0) {
        const user = await db.getUser(id)
        email = user[0].email
    }

    if (name.length == 0) {
        const user = await db.getUser(id)
        name = user[0].fullname
    }

    if (password.length == 0) {
        const user = await db.getUser(id)
        await db.setUserInformation(name, email, mailing, customer, admin, user[0].password, id)
    }
    else {
        const hashedPassword = await bcrypt.hash(password, 12);
        await db.setUserInformation(name, email, mailing, customer, admin, hashedPassword, id)
    }

    res.redirect('/user_page/' + id)
})

app.post('/login', async (req, res) => {
    if (req.body.email.length != 0 && req.body.password.length != 0) {
        const email = req.body.email
        const password = req.body.password

        async function login(email, password) {
            const foundUserHashedPass = await db.attemptLogin(email, password)
            return foundUserHashedPass
        }

        const hashedPass = await login(email, password)

        bcrypt.compare(password, hashedPass, function(err, bcryptRes) {
            if (err) {
                console.log('Password comparison went wrong: ', err);
                loggedIn = false
                res.redirect('/login')
            }
            if (bcryptRes) {
                console.log('Passwords match');
                loggedIn = true
                req.session.user = { email: email } 
                res.redirect('/users')
            }
            else {
                console.log('Passwords do not match');
                loggedIn = false
                res.redirect('/login')
            }
        })
    }
    else {
        console.log('email or password not filled in');
        res.redirect('/login')
    }
})



app.listen(port, host, () => console.log(`Server is running at http://${host}:${port}/`))