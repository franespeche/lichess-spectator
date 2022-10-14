import { launch } from 'puppeteer'
import minimist from 'minimist'
import 'dotenv/config'
import chalk from 'chalk'
import { getActiveGame, now, spectateGame, login, log } from './helpers/index.js'
import fs from 'fs'

const run = (async () => {
  const { user, password, victim, headless = true } = minimist(process.argv.slice(2))

  if (!victim) throw new Error('No victim provided')
  if (!user) throw new Error('No user provided')
  if (!password) throw new Error('No password provided')

  const browser = await launch({ headless })
  const page = await browser.newPage()

  await login(user, password, page)

  // create log stream
  const historyFile = fs.createWriteStream(`spectated-games/${victim}.txt`, {
    flags: 'a',
  })

  // spectate
  log(`waiting for ${chalk.blue(victim)} to start a game..`)
  let lastGameId: undefined | string
  setInterval(async () => {
    let gameId = await getActiveGame(victim)
    if (gameId && gameId !== lastGameId) {
      lastGameId = gameId
      log(chalk.yellow(`${chalk.blue(victim)} is playing!`))

      log('attempting to spectate')
      await spectateGame(page, gameId)
      historyFile.write(`${now()} gameId: ${gameId} \n`)
    }
  }, 15000)
})()
