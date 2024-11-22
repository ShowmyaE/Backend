const express = require('express')
const app = express()
const sqlite3 = require('sqlite3')
const { open } = require('sqlite')
const path = require('path')
const cors = require("cors");



app.use(cors());
app.use(express.json())

const dbPath = path.join(__dirname, 'demodb.db')
let db = null

const initializeDbAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        })
        app.listen(5003, () => {
            console.log('Server Running at http://localhost:5003')
        })
    } catch (error) {
        console.log(`DB Error : ${error.message}`)
        process.exit(1)
    }
}
initializeDbAndServer()


app.post('/transactions', async (req, res) => {
    try {
        const { user, amount, transaction_type } = req.body
        let transactionNumber = 1
        let dateAndTime = new Date().toISOString()
        let statusdata = "PENDING"
        let totalamount = amount;
        let insertquery;
        let finalResult = {}
        if (!amount || !transaction_type || !user) {
            return res.status(400).json({ error: "Missing required fields" })
        }
        const query = `SELECT * FROM transactionData ORDER BY created_at DESC LIMIT 1`
        const query1 = `SELECT * FROM transactionData where user = ${user} ORDER BY created_at DESC LIMIT 1`
        const DbDetails = await db.all(query);
        const userDbDetails = await db.all(query1);
        if (DbDetails.length > 0) {
            transactionNumber = userDbDetails[0].transaction_id + 1;
        }
        if (userDbDetails.length > 0) {
            totalamount = transaction_type === "DEPOSIT" ? userDbDetails[0].amount + amount : userDbDetails[0].amount - amount
        }
        insertquery = `INSERT INTO transactionData(transaction_id,user,amount,transaction_type,status,created_at)
        VALUES ('${transactionNumber}','${user}','${amount}','${transaction_type}','${statusdata}','${dateAndTime}')`;
        const insertData = await db.run(insertquery)
        finalResult.transaction_id = transactionNumber
        finalResult.amount = totalamount
        finalResult.transaction_type = transaction_type
        finalResult.status = statusdata
        finalResult.user = user
        finalResult.timestamp = dateAndTime
        res.send(finalResult)
    }
    catch (error) {
        console.log("ERROR", error)
    }

})

app.get('/transactions', async (req, res) => {
    try {
        const { user_id } = req.query;
        const getUserQuery = `select * from transactionData where user=${user_id}`;
        const userDbDetails = await db.all(getUserQuery);
        console.log('DB value', userDbDetails);
        res.send(userDbDetails)
    }
    catch (error) {
        console.log("ERROR", error)
    }

})

app.get('/transactions/:transactionId', async (req, res) => {
    try {
        const { transactionId } = req.params;
        const getUserQuery = `select * from transactionData where transaction_id=${transactionId}`;
        const userDbDetails = await db.all(getUserQuery);
        console.log('DB value', userDbDetails);
        res.send(userDbDetails)
    }
    catch (error) {
        console.log("ERROR", error)
    }

})

app.put('/transactions/:transactionId', async (req, res) => {
    try {
        const { status } = req.body
        const { transactionId } = req.params;
        const updateUserQuery = `update transactionData SET status='${status}' where transaction_id=${transactionId}`;
        const DbDetails = await db.run(updateUserQuery);
        const getUserQuery = `select * from transactionData where transaction_id=${transactionId}`;
        const userDbDetails = await db.all(getUserQuery);
        console.log('DB value', userDbDetails);
        res.send(userDbDetails)
    }
    catch (error) {
        console.log("ERROR", error)
    }
}) 