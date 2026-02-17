const { MongoClient } = require("mongodb");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Db } = require("mongodb");
const cron = require("node-cron");
const app = express();
const port = 3000;
app.use(bodyParser.json());
app.use(cors({
  orgin: "*"
}))

// Error handling middleware
app.use((error, req, res, next) => { 
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";
  res.status(error.statusCode).json({
    status: error.statusCode,
    message: error.message
  })
})

/////////////////////////////////////////// MONGODB ////////////////////////////////////////////////
// Connect Main Database
const client = new MongoClient(
  "mongodb+srv://Risen:Rub3nC4musC4mpos250904@cluster0.mwdyaje.mongodb.net/", // Your mongoDB cluster URL
);

const database = client.db("PokimonDB"); // Your DB name

// Get Pokemon From Main Database

async function setPokimon(coll) {
  const randomPokimon = await getRandomPokimon(coll);
  const pokimonChars = await getPokimonChars(randomPokimon);
  return pokimonChars;
}

// Fetch MongoDB for a random pokemon name
async function getRandomPokimon(coll) {
  let huesito = await coll
    .find()
    .limit(-1)
    .skip(Math.random() * 151)
    .next();
  let str = huesito.name;
  if (str.length <= 9) {
    return str;
  } else {
    getRandomPokimon(coll);
  }
}

// Generate Pokimon
async function generateDailyPokemon() {
  const mainCollection = database.collection("Pokimon");
  var poki = await setPokimon(mainCollection);
  console.log(`Today's pokemon is ${poki}`);
  return poki;
}

// Connect Daily Collection
async function connectDaily() {
  var dailyCollection = database.collection("DailyPokimon");
  return dailyCollection;
}

async function checkStorage(lastPlayed) { 
  var todayGame = 0; //getToday's 
  if (lastPlayed != todayGame) {
    // delete localStorage and load new game
  }
  else if (lastPlayed == todayGame) {
    // Load localStorage arr of words into the rows
  }
}

async function checkTime() { 
  // Get the latest time at database
  var dailyCollection = await connectDaily();
  // get the last created poki in the dailyCollection
  var latestPoki = await dailyCollection.find().sort({ createdAt: -1 }).limit(1).toArray();
  var lastPokiTime = latestPoki[0].createdAt;

  // Convert the data to milliseconds since Epoch
  const parsedLastPokiTime = Date.parse(lastPokiTime);
  // Var for time now
  let nowTime = Date.now();
  if (parsedLastPokiTime == null) { 
    return console.error("ERROR! No last poki found in DB");
  }
  if (parsedLastPokiTime < nowTime) { 
    console.log('Time has passed to create new Pokimon');
    // Assign new Daily Pokimon
  }
}

async function storeDaily() {
  var dailyCollection = await connectDaily();
  var dailyPoki = await generateDailyPokemon();
  // add the pokimon generated every day the the collection of daily pokis
  await dailyCollection.insertOne({
    name: dailyPoki,
    createdAt: `${new Date()}`,
  });
}


async function getLastPoki() {
  var dailyCollection = await connectDaily();
  // get the last created poki in the dailyCollection
  var latestPoki = await dailyCollection.find().sort({_id:-1}).limit(1).toArray();
  console.log('latestPoki', latestPoki);
  var pokiName = latestPoki[0].name;
  console.log('pokiName', pokiName);
  return pokiName;
}

async function pokiExists(poki) {
  const mainCollection = database.collection("Pokimon");
  // check if poki exists db
  var bool = await mainCollection.countDocuments({ name: poki });
  console.log(bool);
  if (bool > 0) {
    console.log("Poki is in DB ", poki);
  } else {
    console.log("Poki is not in DB ", poki);
  }
  return bool;
}
/////////////////////////////////////////// END OF MONGODB ////////////////////////////////////////////////

cron.schedule('0 5 * * 0-6', async () => { 
    console.log('changing poki every day of week at 5:00');
    await storeDaily();
});


// cron.schedule('*/5 * * * *', async () => { 
//     console.log('changing poki every day of week at 5:00');
//     await storeDaily();
// });

var gameData = {
  secretWord: "",
  gameExists: false,
  gameStatus: "",
  totalGuesses: 0,
  curGuess: 0,
  prevWords: [],
  wordLength: 0,
};

// Get Pokemon string length and convert it to single chars
async function getPokimonChars(poki) {
  var pokimonChars = [];
  for (var i = 0; i < poki.length; i++) {
    let pokiChar = poki.charAt(i);
    pokimonChars.push(pokiChar);
  }
  return pokimonChars;
}

async function checkUserId(id) {
  if (id != null) {console.log('player ID exists');}
  else { 
    var newPlayerId = Math.random() * 255;
   }
  
}

async function startGame() {
  // Establish all possible gameData values
  gameData.date = Date.now();
  gameData.secretWord = await getLastPoki();
  console.log('secretWord is ', gameData.secretWord);
  gameData.wordLength = gameData.secretWord.length;
}

async function errorHandler(playerInput) {
  var err = {
    status: 0,
    message: ""
  }
  if (playerInput.length != gameData.secretWord.length)
    return console.error("Not valid Input!");
  // Check if input row is == curRow
  var existInDatabase = await pokiExists(playerInput);
  if (existInDatabase == false){
    err.status = 404;
    err.message = "Word does not exist!";
    return err;
  } 
  return true;
}


async function handleInput(playerInput) {

  var colors = await inputCompare(playerInput);
  // Input logic is correct, and inputWord is in database.
  gameData.totalGuesses++;
  await gameLogi(colors);
  return colors;

}

async function gameLogi(colors) {
  var correctLetters = 0;
  for (var i = 0; i < colors.length; i++) {
    if (colors[i] ==  "green") {
      correctLetters++;
    }
  }
  if (correctLetters == colors.length) {
    console.log('Player Won!!!');
    gameData.gameStatus = "won";
  }
}

async function inputCompare(inp) {
  var dailyChars = await getLastPoki();
  var inpChars = await getPokimonChars(inp);
  var colors = [];
  for (var i = 0; i < inpChars.length; i++) {
    for (var x = 0; x < dailyChars.length; x++) {
      if (inpChars[i] === dailyChars[i]) {
        console.log("Char is in same position");
        colors.push("green");
        break;
      } else if (inpChars[i] === dailyChars[x]) {
        console.log("Char is in different position");
        colors.push("orange");
        break;
      } else if (x == dailyChars.length - 1) {
        colors.push("grey");
        console.log("Char is not in the word");
      }
    }
  }
  console.log(colors);
  return colors;
}

app.get("/pokemon/:id",async (req, res, next) => {
  var playerInput = req.params.id; // This gets the poki name from the user's input
  var errorHandle = await errorHandler(playerInput);
  if (errorHandle == true) {
    var colors = await handleInput(playerInput);
    var dailyPoki = await getLastPoki(); // Retrieve today's poki from mongoDB
    console.log("dailyPoki is " + dailyPoki + " player input is " + playerInput);
    res.json(colors);
  } else if (errorHandle != true ) {
    console.log('returning error');
    res.json(errorHandle);
  }
});

app.get("/data/curRow",  async (req, res) => {
  // await checkTime();
  console.log(gameData.curRow);
  res.json(gameData.curRow);
  
});

app.get("/start", async (req, res) => {
  await startGame();
  var length = gameData.wordLength;
  console.log(length);
  res.json(length);
});

app.get("/lastplayed/:id", async (req,res) => { 
  // Get player last time played
  var lastPlayed = req.params.id;
  var playedToday = await checkStorage(lastPlayed);
  console.log('put received it is, ', lastPlayed);
  res.send("last time played was ", lastPlayed);
});


app.get("/db/:id", async (req, res) => {
    var pokiInput = req.params.id;
    var bool = await pokiExists(pokiInput);
    res.json(bool);
  });

app.listen(port, () => {
  console.log("app listening on", port);
});
