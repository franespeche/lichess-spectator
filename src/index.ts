import { launch } from "puppeteer"
import "dotenv/config"
import chalk from "chalk"
import { getActiveGame, now, spectateGame, login } from "./helpers/index.js"

// environment

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
	let lastGameId: undefined | string
	let count = 0

	console.log(now(), "watching..")
	await setInterval(async () => {
		// get gameId
		let gameId = await getActiveGame(user)

		if (gameId && gameId !== lastGameId) {
			lastGameId = gameId
			console.log(now(), chalk.yellow(`${user} is playing!`))
			console.log(now(), "attempting to spectate")

			await spectateGame(page, gameId)
		} else if (!gameId) {
			// only log at runtime and every 10 minutes
			count++
			if (count === 1 || !(count % 20)) {
				console.log(now(), `${user} is not playing any game yet`)
			}
		}
	}, 30000)
}

const user = process.argv.slice(2).shift()
if (!user) {
	console.error(now(), `${chalk.red("ERROR:")} no user provided`)
} else {
	run(user)
}
