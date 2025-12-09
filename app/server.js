import express from "express"
import morgan from "morgan"
import dotenv from "dotenv"
import http from "http"
import createHttpError from "http-errors"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import { mainRouter } from "./routes/router.js"
import cors from "cors"
import { initializeConnectionToPG, sequelize } from "./database/postgres_sequelize.js"
import YAML from "yamljs"
import swaggerUI from "swagger-ui-express"
import basicAuth from "express-basic-auth"
dotenv.config()

export class Application {
    #app = express()
    #PORT
    #DB_URL

    constructor(PORT, DB_URL) {
        this.#PORT = PORT
        this.#DB_URL = DB_URL
        this.configureApplication()
        this.connectDB()
        this.createServer()
        this.createRoute()
        this.errorHandler()
    }

    configureApplication() {
        const __filename = fileURLToPath(import.meta.url)
        const __dirname = dirname(__filename)
        let static_path = join(__dirname, "..", "public")
        console.log(static_path)
        this.#app.use(express.static(static_path))
        this.#app.use(cors({
            origin: "*",
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            allowedHeaders: [
                "Content-Type",
                "Authorization",
                "Accept",
                "X-Public-Upload"
            ]
        }))

        this.#app.options("*", cors())

        let swaggerFilePath = join(__dirname, "asar.swagger.yaml")
        let swaggerDocument = YAML.load(swaggerFilePath)

        // Use separate swagger instances to prevent override
        const swaggerUiOptions = {
            explorer: true
        }

        this.#app.use("/api-docs", swaggerUI.serveFiles(swaggerDocument, swaggerUiOptions), swaggerUI.setup(swaggerDocument, swaggerUiOptions))

        let adminFilePath = join(__dirname, "admin.swagger.yaml")
        let adminDocument = YAML.load(adminFilePath)

        this.#app.use("/admin-docs", swaggerUI.serveFiles(adminDocument, swaggerUiOptions), swaggerUI.setup(adminDocument, swaggerUiOptions))
        this.#app.use(morgan("dev"))
        this.#app.use(express.json())
        this.#app.use(
            express.urlencoded({
                extended: true,
                limit: "50mb",
                parameterLimit: 100000,
            })
        )
    }

    createServer() {
        http.createServer(this.#app).listen(this.#PORT)
        if (process.env.APP_STATE == "dev") {
            console.log("run on > https://dev.asar.app")
        }
    }

    connectDB() {
        initializeConnectionToPG().then(() => {
            console.log("init connection ")
            sequelize.sync({ alter: true })
        })
    }

    errorHandler() {
        this.#app.use((req, res, next) => {
            let error = createHttpError.NotFound()
            return res.status(error.statusCode).json({
                message: error.message,
            })
        })
        this.#app.use((err, req, res, next) => {
            if (!err) {
                let error = createHttpError.NotFound()
                return res.status(error.statusCode).json({
                    message: error.message,
                })
            } else {
                console.log(err)
                const serverError = createHttpError.InternalServerError()
                const statusCode = err.status || serverError.statusCode
                let message
                if (process.env.app_state == "dev") {
                    message = err.message || serverError.message
                } else {
                    console.log(err)
                    message = serverError.message
                }
                return res.status(statusCode).json({
                    status: statusCode,
                    message,
                })
            }
        })
    }

    createRoute() {
        // 1) API routes
        this.#app.use("/api/v1", mainRouter)

        // 2) SPA fallback ONLY for non-API requests
        this.#app.get("*", (req, res, next) => {
            if (req.path.startsWith("/api")) {
                return next() // اجازه بده API به router برسد
            }

            const __filename = fileURLToPath(import.meta.url)
            const __dirname = dirname(__filename)
            const indexPath = join(__dirname, "..", "public", "index.html")

            return res.sendFile(indexPath)
        })

        // 3) Global error handler
    }

}
