
import dotenv from "dotenv";
dotenv.config();
import http from "http";
import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import authRoutes from "./routes/auth_route";
import postsRoutes from "./routes/posts";
import commentsRoutes from "./routes/comments";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import userRoutes from "./routes/user_route";
import chatgptRoutes from "./routes/chatgpt_route";
import './config/passport'; 
import cookieParser from "cookie-parser";
import path from 'path';
import cors from "cors";


const app = express();
app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true}));
app.use((req,res, next)=> {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

app.use(bodyParser.json());


app.use(cors({
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


const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use("/auth", authRoutes);
app.use("/posts", postsRoutes);
app.use("/comments", commentsRoutes);
app.use("/api/users", userRoutes);
app.use("/api", chatgptRoutes); 
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

app.use(express.static(path.resolve(__dirname, '..', 'front')));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'front', 'index.html'));
});

const server = http.createServer(app);



const initApp = (): Promise<http.Server> => {
  return new Promise<http.Server>((resolve, reject) => {
    if (process.env.DB_CONNECT === undefined) {
      console.error("DB_CONNECT is not defined");
      reject("DB_CONNECT is not defined");
      return;
    } else {
      mongoose
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

export default initApp;