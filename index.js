import { Application } from "./app/server.js";
import dotenv from 'dotenv'

dotenv.config()
console.log("state = ",process.env.APP_STATE)
new Application(process.env.PORT,process.env.DATABASE_URL)