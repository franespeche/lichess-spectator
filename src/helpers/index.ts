import axios from "axios"
import chalk from "chalk"
import {DateTime} from "luxon"
import {Page} from "puppeteer"
import {LOGIN_STATUS} from "src/types/common"
import {TUserStatus} from "../types/user"

// environment
const BASE_URL = "https://lichess.org"
const USER_STATUS_ENDPOINT = `${BASE_URL}/api/users/status`

// helpers
export const now = (): string => {
  const now = DateTime.now().toObject()
  return `[${now.hour}:${now.minute}:${now.second}]`
}

export const getUserStatus = async (user: string): Promise<TUserStatus> => {
  const endpoint = `${USER_STATUS_ENDPOINT}?ids=${user}&withGameIds=true`
  const res = await axios.get(endpoint)
  return res.data[0]
}

export const getActiveGame = async (
  user: string
): Promise<string | undefined> => {
  const userStatus = await getUserStatus(user)
  return userStatus?.playingId
}

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
