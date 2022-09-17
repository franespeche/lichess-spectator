import axios from "axios"
import chalk from "chalk"
import {DateTime} from "luxon"
import {Page} from "puppeteer"
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
): Promise<{status: string; error?: any}> => {
  if (!user) {
    return {
      status: "fail",
      error: 'No user provided',
    }
  }
  if (!password) {
    return {
      status: "fail",
      error: 'No password provided',
    }
  }

  console.log(now(), `logging in as: ${chalk.cyan(user)}`)

  try {
    // fill in form
    await page.goto("https://lichess.org/login?referrer=/")
    await page.type("#form3-username", user)
    await page.type("#form3-password", password)
    await page.click("button.submit")

    await page.waitForNavigation()
    return {status: "success"}
  } catch (e) {
    // fail
    return {status: "failed", error: e}
  }
}

export const spectateGame = async (page: Page, gameId: string) => {
  try {
    await page.goto(`https://lichess.org/${gameId}`, {
      waitUntil: "networkidle2",
    })

    console.log(now(), chalk.yellow(`spectating game ${gameId} :)`))
  } catch (e) {
    console.error(
      now(),
      chalk.red("ERROR:") + `couldnt spectate game ${gameId}`
    )
  }
  return
}
