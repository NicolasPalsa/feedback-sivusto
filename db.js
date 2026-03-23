import mysql from 'mysql2/promise'
import dbconfig from './dbconfig.json' with { type: 'json' }
const pool = mysql.createPool(dbconfig)

const getConnection = async () => {
    try {
        const connection = await pool.getConnection()
        return connection
    }
    catch (error) {
        console.error('Error getting MySQL connection:', error)
        throw error
    }
}

const getUsers = async () => {
    try {
        const connection = await getConnection()
        const sql = `
                    SELECT customer.name AS 'customer',
                    system_user.id AS 'id',
                    system_user.fullname AS 'full name',
                    system_user.email AS 'email',
                    CASE 
                        WHEN system_user.admin = 0 THEN 'false'
                        ELSE 'true'
                    END AS 'admin'
                    FROM customer
                    RIGHT JOIN system_user
                    ON customer.id = system_user.customer_id
                    `
        const [users] = await connection.execute(sql)
        connection.release()
        return users
    } catch (error) {
        console.error('Error getting users:', error)
        throw error
    }
}

const getUserName = async (id) => {
    try {
        const connection = await getConnection()
        const sql = `
                    SELECT system_user.fullname AS 'full_name'
                    FROM system_user
                    WHERE system_user = ?
                    `
        const user = await connection.execute(sql, [id])
        connection.release()
        return user
    } catch (error) {
        throw error
    }
}

const getSupport = async () => {
    try {
        const connection = await getConnection()
        const sql = `
                    SELECT ticket_status.description AS 'status',
                    support_ticket.id AS 'id',
                    support_ticket.arrived AS 'arrived',
                    customer.name AS 'customer',
                    support_ticket.description AS 'description',
                    support_ticket.handled AS 'handled'
                    FROM ticket_status
                    JOIN support_ticket
                    JOIN customer
                    ON customer.id = support_ticket.customer_id
                    AND ticket_status.id = support_ticket.status
                    `
        const [support] = await connection.execute(sql)
        connection.release()
        return support
    } catch (error) {
        console.error('Error getting support:', error)
        throw error
    }
}

const getSupportMessages = async (id) => {
    try {
        const connection = await getConnection()
        const support = await getSupport()
        const sql = `
                    SELECT support_message.created_at AS 'message_date',
                    system_user.fullname AS 'message_name',
                    support_message.body AS 'reply'

                    FROM support_message
                    JOIN system_user

                    ON system_user.id = support_message.from_user
                    AND support_message.ticket_id = ?
                    `
        const [messages] = await connection.execute(sql, [id])

        connection.release()
        return { support, messages }
    } catch (error) {
        console.log('Error getting support ticket messages:', error)
        throw error
    }
}

const getFeedback = async () => {
    try {
        const connection = await getConnection()
        const sql = `
                    SELECT system_user.fullname AS 'customer',
                    feedback.arrived AS 'arrived',
                    feedback.guest_name AS 'guest name',
                    feedback.guest_email AS 'guest email',
                    feedback.feedback AS 'feedback',
                    feedback.handled AS 'handled'
                    FROM system_user
                    RIGHT JOIN feedback
                    ON system_user.id = feedback.from_user
                    `
        const [feedback] = await connection.execute(sql)
        connection.release()
        return feedback
    }
    catch (error) {
        console.error('Error getting feedback:', error)
        throw error
    }
}

const addMessage = async (ticket_id, from_user, body) => {
    try {
        const connection = await getConnection()
        const sql = `
                    INSERT INTO support_message (ticket_id, from_user, body)
                    VALUES (?, ?, ?)
                    `
        await connection.execute(sql, [ticket_id, from_user, body])
        connection.release()
    } catch (error) {
        console.log('Error adding message:', error);
    }
}

const changeTicketStatus = async (ticket_id, status) => {
    const handled_date = new Date().toISOString().slice(0, 19).replace('T', ' ')
    try {
        const connection = await getConnection()
        if (status == 4) {
            const sql = `
                        UPDATE support_ticket 
                        SET status = ?,
                        handled = ?
                        WHERE id = ?
                        `
            await connection.execute(sql, [status, handled_date, ticket_id])
            connection.release()
        }
        else {
            const sql = `
                        UPDATE support_ticket 
                        SET status = ?,
                        handled = NULL
                        WHERE id = ?
                        `
            await connection.execute(sql, [status, ticket_id])
            connection.release()
        }
    } catch (error) {
        console.log(`Error changing status of ticket ${ticket_id}:`, error);
    }
}

const attemptLogin = async (email, password) => {
    try {
        const connection = await getConnection()
        const sql = `
                    SELECT system_user.email AS 'email',
                    system_user.password AS 'password',
                    system_user.admin AS 'admin'
                    FROM system_user
                    WHERE ADMIN = 1
                    AND email = ?                    
                    `
        const [bool] = await connection.execute(sql, [email])
        connection.release()

        if (bool[0] != undefined) {
            console.log('User found');
            return bool[0].password
        } else {
            console.log('No user found')
            return false
        }
    } catch (error) {
        console.log('Error attempting login:', error);
    }
}



export default {
    getUsers,
    getUserName,
    getSupport,
    getSupportMessages,
    getFeedback,
    addMessage,
    changeTicketStatus,
    attemptLogin
}