// Imports
import express from 'express'
import mysql from 'mysql2/promise'
import path from 'node:path'

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
        console.log(rows);
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

app.post('/login', async (req, res) => {
    if (req.body.email.length != 0 && req.body.password.length != 0) {
        const email = req.body.email
        const password = req.body.password

        loggedIn = await db.attemptLogin(email, password)

        if (loggedIn == true) {
            res.redirect('/users')
        } else {
            res.redirect('/login')
        }
    }
    else {
        console.log('email or password not filled in');
        res.redirect('/login')
    }
})

app.listen(port, host, () => console.log(`Server is running at http://${host}:${port}/`))