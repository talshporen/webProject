"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const Users_1 = __importDefault(require("../models/Users"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
console.log("🔹 Passport configuration initialized.");
passport_1.default.serializeUser((user, done) => {
    console.log("🔹 Serializing user:", user.id);
    done(null, user.id);
});
passport_1.default.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("🔹 Deserializing user:", id);
    try {
        const user = yield Users_1.default.findById(id);
        done(null, user);
    }
    catch (err) {
        done(err, false);
    }
}));
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        console.log("🔹 Google OAuth authentication started.");
        console.log("🔹 User Profile:", profile);
        const email = (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
        let username = (_c = profile.displayName) === null || _c === void 0 ? void 0 : _c.trim();
        console.log("🔹 Before checking - username:", username);
        if (!username || username.trim() === "") {
            username = email ? email.split("@")[0] : `user_${Date.now()}`;
            console.warn("🔹 No username found in Google profile, using fallback:", username);
        }
        console.log("🔹 Final username before saving:", username);
        if (!username) {
            console.error("❌ CRITICAL ERROR: username is still undefined before saving!");
            return done(new Error("Username is required"), false);
        }
        // 📌 **נבדוק אם המשתמש כבר קיים לפי האימייל**
        let user = yield Users_1.default.findOne({ email });
        if (user) {
            console.log("🔹 Existing user found, updating Google ID...");
            // 🔹 **אם למשתמש אין שם משתמש - נוסיף אותו עכשיו**
            if (!user.username || user.username.trim() === "") {
                console.log("🔹 User has no username, updating...");
                user.username = username;
            }
            if (!user.googleId) {
                user.googleId = profile.id;
            }
            yield user.save();
            return done(null, user);
        }
        // 📌 **אם המשתמש לא קיים - ניצור חדש**
        const newUser = new Users_1.default({
            username,
            email,
            googleId: profile.id,
            profilePicture: (_e = (_d = profile.photos) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.value,
        });
        console.log("🔹 Creating new user:", newUser);
        yield newUser.save();
        console.log("🔹 New user created:", newUser.email);
        done(null, newUser);
    }
    catch (err) {
        console.error("🔹 Google OAuth Error:", err);
        done(err, false);
    }
})));
//# sourceMappingURL=passport.js.map