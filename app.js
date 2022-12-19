const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketTeam.db");
let db = null;

const initializeDBAndServer = async () => {
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

initializeDBAndServer();

//API 1 Returns a list of all players in the team

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    jerseyNumber: dbObject.jersey_number,
    role: dbObject.role,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayers = `SELECT * FROM cricket_team;`;
  const playersArray = await db.all(getPlayers);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

//API 2  creates a new player in the team (database)

app.post("/players/", async (request, response) => {
  const playerDetails = request.body;
  const { playerName, jerseyNumber, role } = playerDetails;
  const addPlayer = `
    INSERT INTO
      cricket_team (player_name, jersey_number, role)
    VALUES
      (
        '${playerName}',
        '${jerseyNumber}',
        '${role}'
      );`;
  const dbResponse = await db.run(addPlayer);
  const playerId = dbResponse.lastID;
  response.send("Player Added to Team");
});

//API 3  Returns a player based on a player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerId = `SELECT * FROM cricket_team WHERE player_id = ${playerId};`;
  const player = await db.get(getPlayerId);
  response.send(convertDbObjectToResponseObject(player));
});

//API 4 Updates the details of a player in the team based on the player ID

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName, jerseyNumber, role } = playerDetails;
  const updatePlayer = `UPDATE cricket_team SET 
  player_name='${playerName}', jersey_number='${jerseyNumber}', role='${role}'
  WHERE player_id=${playerId};`;
  await db.run(updatePlayer);
  response.send("Player Details Updated");
});

//API 5 Deletes a player from the team based on the player ID

app.delete("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const deletePlayer = `DELETE FROM cricket_team WHERE player_id=${playerId};`;
  await db.run(deletePlayer);
  response.send("Player Removed");
});

module.exports = app;
