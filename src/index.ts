import {launch} from "puppeteer"
import minimist from "minimist"
import "dotenv/config"
import chalk from "chalk"
import {getActiveGame, now, spectateGame, login} from "./helpers/index.js"
import fs from "fs"

const run = (async () => {
  const {user, password, victim} = minimist(process.argv.slice(2))

  if (!victim) {
    throw new Error('No victim provided')
  }

  if (!user) {
    throw new Error('No user provided')
  }

  if (!password) {
    throw new Error('No password provided')
  }

  const browser = await launch({headless: true})
  const page = await browser.newPage()


  // Log in to Lichess
  const {success} = await login(user, password, page)
  if (!success) {
    throw new Error(`Error while trying to login`)
  }

  console.log(now(), chalk.green("success!"))
  console.log()

  // Watch & spectate

  // create log stream
  const stream = fs.createWriteStream(`spectated-games/${victim}.txt`, {
    flags: "a",
  })

  // Track retries and lastGameId
  let lastGameId: undefined | string

  // Start watching
  console.log(now(), `waiting for ${chalk.blue(victim)} to start a game..`)
  setInterval(async () => {
    // Get gameId
    let gameId = await getActiveGame(victim)

    // If there is an active game and it differs from the last spectated one, spectate
    if (gameId && gameId !== lastGameId) {
      // Update lastGameId
      lastGameId = gameId

      console.log(now(), chalk.yellow(`${chalk.blue(victim)} is playing!`))
      console.log(now(), "attempting to spectate")

      // Spectate game
      await spectateGame(page, gameId)

      stream.write(`${now()} gameId: ${gameId} \n`)
    }
  }, 15000)
})()
