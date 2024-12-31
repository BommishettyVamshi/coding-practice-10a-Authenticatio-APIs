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

//API 5
app.get('/districts/:districtId/', authenticateToken, async (req, res) => {
  try {
    const {districtId} = req.params
    const selectQuery = `select * from district where district_id = ${districtId};`

    const ans = districtDetails => {
      return {
        districtId: districtDetails.district_id,
        districtName: districtDetails.district_name,
        stateId: districtDetails.state_id,
        cases: districtDetails.cases,
        cured: districtDetails.cured,
        active: districtDetails.active,
        deaths: districtDetails.deaths,
      }
    }

    const district = await db.get(selectQuery)
    res.send(ans(district))
    console.log(
      `DistrictDetails of districtId: ${districtId} are fetched successfully...`,
    )
  } catch (e) {
    console.log(`Request Error: ${e.message}`)
  }
})

//API 6
app.delete('/districts/:districtId/', authenticateToken, async (req, res) => {
  try {
    const {districtId} = req.params
    const getQuery = `select * from district where district_id = ${districtId};`

    const dbResultOfGetQuery = await db.get(getQuery, (err, row) => {
      if (err) {
        return false
      }
      if (row) {
        return true
      }
    })

    if (dbResultOfGetQuery) {
      console.log(
        `District with dirstictId: ${districtId} is exists in the database`,
      )
      const deleteQuery = `delete from district where district_id = ${districtId} ;`

      await db.run(deleteQuery)
      res.send('District Removed')
      console.log(
        `District with districtId: ${districtId} is removed successfully...`,
      )
    } else {
      res.send(
        `District with districtId: ${districtId} does not exists in the db`,
      )
    }
  } catch (e) {
    console.log(`Request Error: ${e.message}`)
  }
})

//API 7
app.put('/districts/:districtId/', authenticateToken, async (req, res) => {
  try {
    const {districtId} = req.params
    const {districtName, stateId, cases, cured, active, deaths} = req.body
    const getQuery = `select * from district where district_id = ${districtId};`

    const dbResultOfGetQuery = await db.get(getQuery, (err, row) => {
      if (err) {
        return false
      }
      if (row) {
        return true
      }
    })

    if (dbResultOfGetQuery) {
      console.log(
        `District with dirstictId: ${districtId} is exists in the database`,
      )
      const updateQuery = `update district set district_name = ? , state_id =? , cases = ? , cured = ?, active = ?, deaths = ? where district_id = ? ;`
      await db.run(updateQuery, [
        districtName,
        stateId,
        cases,
        cured,
        active,
        deaths,
        districtId,
      ])

      res.send('District Details Updated')
      console.log(
        `District Details of districtId: ${districtId} are updated successfully...`,
      )
    } else {
      console.log(
        `District with districtId: ${districtId} does not exists in the db`,
      )
      res.send(
        `District with districtId: ${districtId} does not exists in the db`,
      )
    }
  } catch (e) {
    console.log(`Request Error: ${e.message}`)
  }
})

//API 8
app.get('/states/:stateId/stats/', authenticateToken, async (req, res) => {
  try {
    const {stateId} = req.params
    const getQuery = `select state_id as stateId from state where state_id = ${stateId};`

    const dbResultOfGetQuery = await db.get(getQuery)
    console.log(dbResultOfGetQuery.stateId)

    const ans = districtStatsDetails => {
      return {
        totalCases: districtStatsDetails.totalCases,
        totalCured: districtStatsDetails.totalCured,
        totalActive: districtStatsDetails.totalActive,
        totalDeaths: districtStatsDetails.totalDeaths,
      }
    }

    const strStateId = dbResultOfGetQuery.stateId.toString()

    if (dbResultOfGetQuery !== undefined && stateId === strStateId) {
      console.log(`state with stateId: ${stateId} exists in the db`)
      const selectQuery = `select sum(d.cases) as totalCases, sum(d.cured) as totalCured, sum(d.active) as totalActive, sum(d.deaths)as totalDeaths from district d join state s on s.state_id = d.state_id where d.state_id = ${stateId};`
      const dbResult = await db.all(selectQuery)
      console.log(dbResult)
      res.send(ans(dbResult[0]))
      console.log(
        `Stats of state with state: ${stateId} are fecthed successfully...`,
      )
    } else {
      console.log(`state with stateId: ${stateId} does not exists in the db..`)
    }
  } catch (e) {
    console.log(`Request Error: ${e.message}`)
  }
})
