const express = require('express')
const path = require('path')
const jwtToken = require('jsonwebtoken')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19IndiaPortal.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log(
        'Server is running at https://vamshincue4njscpikngv.drops.nxtwave.tech...',
      )
    })
  } catch (e) {
    console.log(`Connection Error: ${e.message}`)
  }
}

initializeDBAndServer()

//MiddleWare function 
const authenticateToken = async 

//API 1 generating jwtToken
app.post('/login/', async (req,res) => {
    try{
        const {username,password} = req.body

    }
})