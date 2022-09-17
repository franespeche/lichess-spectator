import axios from "axios"
import chalk from "chalk"
import {DateTime} from "luxon"
import {Page} from "puppeteer"
import {TUserStatus} from "../types/user"

// environment
const BASE_URL = "https://lichess.org"
const USER_STATUS_ENDPOINT = `${BASE_URL}/api/users/status`

/**
 * Gets human readable current time
 * @Returns - Human readable current time: '[00:01:10]'
 */
export const now = (): string => {
  const now = DateTime.now().toObject()
  return `[${now.hour}:${now.minute}:${now.second}]`
}

/**
 * Gets the given user's status
 * @Param user {string} - The username to get its status
 * @Returns {Promise<TUserStatus>} - A promise with the user's status
 */
const getUserStatus = async (user: string): Promise<TUserStatus> => {
  const endpoint = `${USER_STATUS_ENDPOINT}?ids=${user}&withGameIds=true`
  const res = await axios.get(endpoint)
  return res.data[0]
}

/**
 * Gets a given user's active game
 * @Param user {string} - The username to get its active game
 * @Returns {Promise<gameId: string>} - A promise with the gameId
 */
export const getActiveGame = async (
  user: string
): Promise<string | undefined> => {
  const userStatus = await getUserStatus(user)
  return userStatus?.playingId
}

/**
 * Logs in to Lichess with the given credentials
 * @Param user {string} - The username
 * @Param password {string} - The password
 * @Returns {Promise<success: boolean>} - A promise with success
 */
export const login = async (
  user: string,
  password: string,
  page: Page
): Promise<{success: boolean}> => {
  if (!user) {
    throw new Error(`Missing parameter: user`)
  }
  if (!password) {
    throw new Error(`Missing parameter: passowrd`)
  }

  console.log(now(), `logging in as: ${chalk.cyan(user)}`)

  try {
    // fill in form
    await page.goto("https://lichess.org/login?referrer=/")
    await page.type("#form3-username", user)
    await page.type("#form3-password", password)
    await page.click("button.submit")

    await page.waitForNavigation()

    return {success: true}
  } catch (err: any) {
    throw new Error(`Failed with error: ${err}`)
  }
}

/**
 * Spectates a given gameId
 * @Param page {Page} - The Puppeteer's Page instance
 * @Param gameId {string} - The active gameId
 * @Returns
 */
export const spectateGame = async (page: Page, gameId: string) => {
  try {
    const endpoint = `${BASE_URL}/${gameId}`

    await page.goto(endpoint, {
      waitUntil: "networkidle2",
    })

    console.log(now(), chalk.yellow(`spectating game ${gameId} :)`))
  } catch (err) {
    console.error(
      now(),
      chalk.red("ERROR:") + `Error spectating game:"${gameId}", err`
    )
  }
  return
}
