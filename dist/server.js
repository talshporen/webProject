"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const body_parser_1 = __importDefault(require("body-parser"));
const auth_route_1 = __importDefault(require("./routes/auth_route"));
const posts_1 = __importDefault(require("./routes/posts"));
const comments_1 = __importDefault(require("./routes/comments"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const user_route_1 = __importDefault(require("./routes/user_route"));
const chatgpt_route_1 = __importDefault(require("./routes/chatgpt_route"));
require("./config/passport");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
const swaggerOptions = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "API Documentation",
            version: "1.0.0",
            description: "API Documentation for the project",
        },
        servers: [
            {
                url: "http://localhost:" + process.env.PORT,
                description: "Local server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: ["./src/routes/*.ts"],
};
const swaggerDocs = (0, swagger_jsdoc_1.default)(swaggerOptions);
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocs));
app.use("/auth", auth_route_1.default);
app.use("/posts", posts_1.default);
app.use("/comments", comments_1.default);
app.use("/api/users", user_route_1.default);
app.use("/api", chatgpt_route_1.default);
app.use('/uploads', express_1.default.static(path_1.default.resolve(__dirname, '..', 'uploads')));
app.use(express_1.default.static(path_1.default.resolve(__dirname, '..', 'front')));
app.get('*', (req, res) => {
    res.sendFile(path_1.default.resolve(__dirname, '..', 'front', 'index.html'));
});
const server = http_1.default.createServer(app);
const initApp = () => {
    return new Promise((resolve, reject) => {
        if (process.env.DB_CONNECT === undefined) {
            console.error("DB_CONNECT is not defined");
            reject("DB_CONNECT is not defined");
            return;
        }
        else {
            mongoose_1.default
                .connect(process.env.DB_CONNECT)
                .then(() => {
                console.log("Connected to database");
                resolve(server);
            })
                .catch((err) => {
                console.error("Database connection error:", err);
                reject(err);
            });
        }
    });
};
exports.default = initApp;
//# sourceMappingURL=server.js.map