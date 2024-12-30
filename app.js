const express = require('express')
const path = require('path')
const jwtToken = require('jsonwebtoken')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

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
const authenticateToken = (req, res, next) => {
  let jwtToken
  const authHeader = req.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }

  if (jwtToken === undefined) {
    res.status(401).send('Invalid JWT Token')
    console.log('Invalid JWT Token / Provide the JWT token ')
  } else {
    jwt.verify(jwtToken, 'BommishettyVamshi', async (error, payload) => {
      if (error) {
        res.status(401).send('Invalid JWT Token')
      } else {
        req.username = payload.username
        console.log('User Authentication is Successfully verified...')
        next()
      }
    })
  }
}

//API 1 generating jwtToken
app.post('/login/', async (req, res) => {
  try {
    const {username, password} = req.body
    const selectQuery = `select * from user where username = '${username}';`
    const dbUser = await db.get(selectQuery)

    if (dbUser === undefined) {
      res.status(400).send('Invalid user')
    } else {
      const isPasswordMatched = await bcrypt.compare(password, dbUser.password)

      if (!isPasswordMatched) {
        res.status(400).send('Invalid password')
      } else {
        const payload = {
          username: username,
        }

        const jwtToken = jwt.sign(payload, 'BommishettyVamshi')
        res.send({jwtToken})
        console.log('Successfully jwtToken is generated')
      }
    }
  } catch (e) {
    console.log(`Request Error: ${e.message}`)
  }
})

//API 2
app.get('/states/', authenticateToken, async (req, res) => {
  try {
    const selectQuery = `select * from state;`

    const ans = eachState => {
      return {
        stateId: eachState.state_id,
        stateName: eachState.state_name,
        population: eachState.population,
      }
    }

    const statesDetailList = await db.all(selectQuery)
    res.send(statesDetailList.map(eachState => ans(eachState)))
    console.log('statesDetails are fecthed successfully..')
  } catch (e) {
    console.log(`Request Error: ${e.message}`)
  }
})

//API 3
app.get('/states/:stateId/', authenticateToken, async (req, res) => {
  try {
    const {stateId} = req.params
    const selectQuery = `select * from state where state_id = ${stateId};`

    const ans = eachState => {
      return {
        stateId: eachState.state_id,
        stateName: eachState.state_name,
        population: eachState.population,
      }
    }

    const stateDetails = await db.get(selectQuery)
    res.send(ans(stateDetails))
    console.log(
      `state details of stateId ${stateId} are successfully fetched...`,
    )
  } catch (e) {
    console.log(`Request Error: ${e.message}`)
  }
})

//API 4
app.post('/districts/', authenticateToken, async (req, res) => {
  try {
    const {districtName, stateId, cases, cured, active, deaths} = req.body
    const insertQuery =
      'insert into district (district_name,state_id,cases,cured,active,deaths) values(?,?,?,?,?,?); '

    const districtId = await db.run(insertQuery, [
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    ])
    res.send('District Successfully Added')
    console.log(`District is created with id: ${districtId.lastID}`)
  } catch (e) {
    console.log(`Request Error: ${e.message}`)
  }
})


