const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//1.

app.get("/states/", async (request, response) => {
  const getAllStateQuery = `
    SELECT
       *
     FROM
        state;`;
  const statesArray = await db.all(getAllStateQuery);
  response.send(
    statesArray.map((stateObject) =>
      convertDbObjectToResponseObject(stateObject)
    )
  );
});

//2.

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `
    SELECT
       *
    FROM
        state
    WHERE
        state_id = ${stateId}`;
  const stateDetails = await db.get(stateQuery);
  response.send(convertDbObjectToResponseObject(stateDetails));
});

//3.

app.post("/districts/", async (request, response) => {
  const newDistrict = request.body;

  const { districtName, stateId, cases, cured, active, deaths } = newDistrict;

  const addingNewDistrict = `
    INSERT INTO
          districts (district_name,
            state_id,
            cases,
            cured,
            active,
            deaths )
    VALUES (
            '${districtName}',
            '${stateId}',
            '${cases}',
            '${cured}',
            '${active}',
            '${deaths}')`;

  const dbResponse = await db.run(addingNewDistrict);
  const newDistrictDetails = dbResponse.lastID;
  response.send("District Successfully Added");
});

//4.

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = `
    SELECT
      *
    FROM
        district
    WHERE
        district_id = ${districtId}`;

  const districtArray = await db.get(districtDetails);
  response.send(convertDbObjectToResponseObject(districtArray));
});

//5.

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const removeDistrict = `
    DELETE FROM
           district
        WHERE
           district_id = ${districtId}`;

  await db.run(removeDistrict);
  response.send("District Removed");
});

//6.

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;

  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const updateDistrictDetails = `
       UPDATE district SET
                         district_name = '${districtName}',
                         state_id = '${stateId}',
                         cases = '${cases}',
                         cured = '${cured}',
                         active = '${active}',
                         deaths = '${deaths}'
                  WHERE district_id = ${districtId}`;

  await db.run(updateDistrictDetails);
  response.send("District Details Updated");
});

//7.

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `
    SELECT
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
    FROM
       WHERE
          state_id = ${stateId}`;

  const stateDetails = await db.get(stateQuery);
  response.send({
    totalCases: stateDetails["SUM(cases)"],
    totalCured: stateDetails["SUM(cured)"],
    totalActive: stateDetails["SUM(active)"],
    totalDeaths: stateDetails["SUM(deaths"],
  });
});

//8.

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateQuery = `
    SELECT 
        state_name
    FROM
        state NATURAL JOIN district
    WHERE
        district_id = ${districtId}`;

  const stateName = await db.get(stateQuery);
  response.send(convertDbObjectToResponseObject(stateName));
});

module.exports = app;
