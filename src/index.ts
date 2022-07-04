import { launch } from "puppeteer"
import "dotenv/config"
import chalk from "chalk"
import { getActiveGame, now, spectateGame, login } from "./helpers/index.js"
import fs from "fs"

const log = (message: string) => {}

const run = async (user: string) => {
	const browser = await launch({ headless: true })
	const page = await browser.newPage()

	/**
	 * Log in to Lichess
	 */
	const lichessLogin = await login(page)
	if (lichessLogin.error) {
		// fail
		console.error(now(), `${chalk.red(`ERROR:`)} ${lichessLogin.error}`)
		return
	}
	console.log(now(), chalk.green("success!"))
	console.log()

	/**
	 * Watch & spectate
	 */

	// create log stream
	const stream = fs.createWriteStream(`spectated-games/${user}.txt`, {
		flags: "a",
	})

	// track retries and lastGameId
	let lastGameId: undefined | string
	let retries = 0

	// start watching
	console.log(now(), `waiting for ${chalk.blue(user)} to start a game..`)
	await setInterval(async () => {
		// get gameId
		let gameId = await getActiveGame(user)

		if (gameId && gameId !== lastGameId) {
			// update lastGameId
			lastGameId = gameId
			retries = 0

			console.log(now(), chalk.yellow(`${chalk.blue(user)} is playing!`))
			console.log(now(), "attempting to spectate")

			await spectateGame(page, gameId)

			stream.write(`${now()} gameId: ${gameId} \n`)
		} else if (!gameId) {
			// only log at runtime and once every 30 minutes
			retries++
			if (retries === 1 || !(retries % 60)) {
				console.log(now(), `still no news :(`)
			}
		}
	}, 6000)
}

const user = process.argv.slice(2).shift()
if (!user) {
	console.error(now(), `${chalk.red("ERROR:")} no user provided`)
} else {
	run(user)
}
