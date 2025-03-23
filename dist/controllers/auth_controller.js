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
exports.authMiddleware = void 0;
const Users_1 = __importDefault(require("../models/Users"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const CLIENT_CONNECT = process.env.CLIENT_CONNECT;
const accessTokenExpires = process.env.TOKEN_EXPIRATION || "1h";
const refreshTokenExpires = process.env.REFRESH_TOKEN_EXPIRATION || "7d";
console.log("🔹 Generating token with expiresIn:", accessTokenExpires, refreshTokenExpires);
const generateToken = (userId) => {
    if (!process.env.TOKEN_SECRET) {
        return null;
    }
    const random = Math.random().toString();
    const accessToken = jsonwebtoken_1.default.sign({ _id: userId, random }, process.env.TOKEN_SECRET, { expiresIn: process.env.TOKEN_EXPIRATION });
    const refreshToken = jsonwebtoken_1.default.sign({ _id: userId, random }, process.env.TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION });
    return { accessToken, refreshToken };
};
//
// =============== REGISTER ===============
//
const register = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            res.status(400).json({ message: 'Username, email, and password are required' });
            return;
        }
        const existingUser = yield Users_1.default.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            if (existingUser.email === email) {
                res.status(409).json({ message: 'Email is already registered' });
                return;
            }
            if (existingUser.username === username) {
                res.status(409).json({ message: 'Username is already taken' });
                return;
            }
        }
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(password, salt);
        let profilePictureUrl = '';
        if (req.file) {
            const SERVER_CONNECT = process.env.SERVER_CONNECT;
            profilePictureUrl = `${SERVER_CONNECT}/uploads/${req.file.filename.replace(/\\/g, '/')}`;
        }
        else {
            const SERVER_CONNECT = process.env.SERVER_CONNECT;
            profilePictureUrl = `${SERVER_CONNECT}/uploads/1741781673180-376059482.jpg`;
        }
        const user = yield Users_1.default.create({
            username,
            email,
            password: hashedPassword,
            profilePicture: profilePictureUrl
        });
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                username: user.username,
                email: user.email,
                _id: user._id,
                profilePicture: user.profilePicture
            },
        });
    }
    catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
//
// =============== LOGIN ===============
//
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }
        const user = yield Users_1.default.findOne({ email });
        if (!user) {
            res.status(400).json({ message: 'Wrong email or password' });
            return;
        }
        const validPassword = user.password
            ? yield bcrypt_1.default.compare(password, user.password)
            : false;
        if (!validPassword) {
            res.status(400).json({ message: 'Wrong email or password' });
            return;
        }
        const tokens = generateToken(user._id);
        if (!tokens) {
            res.status(500).json({ message: 'Failed to generate tokens' });
            return;
        }
        if (!user.refreshToken) {
            user.refreshToken = [];
        }
        user.refreshToken.push(tokens.refreshToken);
        yield user.save();
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(200).json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            _id: user._id,
            username: user.username,
            isAuthenticated: true,
            likedPosts: user.likedPosts,
        });
    }
    catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});
const verifyRefreshToken = (refreshToken) => {
    return new Promise((resolve, reject) => {
        if (!refreshToken) {
            reject('fail');
            return;
        }
        if (!process.env.TOKEN_SECRET) {
            reject('fail');
            return;
        }
        jsonwebtoken_1.default.verify(refreshToken, process.env.TOKEN_SECRET, (err, payload) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                reject('fail');
                return;
            }
            const userId = payload._id;
            try {
                const user = yield Users_1.default.findById(userId);
                if (!user) {
                    reject('fail');
                    return;
                }
                if (!user.refreshToken || !user.refreshToken.includes(refreshToken)) {
                    user.refreshToken = [];
                    yield user.save();
                    reject('fail');
                    return;
                }
                user.refreshToken = user.refreshToken.filter((t) => t !== refreshToken);
                resolve(user);
            }
            catch (err) {
                reject('fail');
            }
        }));
    });
};
const refresh = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tokenFromBody = req.body.refreshToken;
        const tokenFromCookie = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken;
        const usedRefreshToken = tokenFromBody || tokenFromCookie;
        if (!usedRefreshToken) {
            res.status(400).send('fail');
            return;
        }
        const user = yield verifyRefreshToken(usedRefreshToken);
        if (!user) {
            res.status(400).send('fail');
            return;
        }
        const tokens = generateToken(user._id);
        if (!tokens) {
            res.status(500).send('Server Error');
            return;
        }
        yield Users_1.default.findByIdAndUpdate(user._id, { $push: { refreshToken: tokens.refreshToken } }, { new: true });
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(200).json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            _id: user._id
        });
    }
    catch (err) {
        res.status(400).send('fail');
    }
});
//
// =============== LOGOUT ===============
//
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tokenFromBody = req.body.refreshToken;
        const tokenFromCookie = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken;
        const usedRefreshToken = tokenFromBody || tokenFromCookie;
        if (!usedRefreshToken) {
            res.status(400).send('fail');
            return;
        }
        const user = yield verifyRefreshToken(usedRefreshToken);
        user.refreshToken = [];
        yield user.save();
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        res.status(200).send('success');
    }
    catch (err) {
        res.status(400).send('fail');
    }
});
//
// =============== GOOGLE CALLBACK ===============
//
const googleCallback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user._id) {
            res.status(500).json({ message: 'User ID is undefined' });
            return;
        }
        const tokens = generateToken(user._id);
        if (!tokens) {
            res.status(500).json({ message: 'No token' });
            return;
        }
        if (!user.refreshToken) {
            user.refreshToken = [];
        }
        user.refreshToken.push(tokens.refreshToken);
        yield user.save();
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.redirect(`${CLIENT_CONNECT}/oauth/callback?token=${tokens.accessToken}&userId=${user._id}&username=${encodeURIComponent(user.username)}`);
    }
    catch (err) {
        console.error('Error googleCallback:', err);
        res.status(500).json({ message: 'Error' });
    }
});
const authMiddleware = (req, res, next) => {
    const authorization = req.header('authorization');
    const token = authorization && authorization.split(' ')[1];
    if (!token) {
        res.status(401).send('Access Denied');
        return;
    }
    if (!process.env.TOKEN_SECRET) {
        res.status(500).send('Server Error');
        return;
    }
    jsonwebtoken_1.default.verify(token, process.env.TOKEN_SECRET, (err, payload) => {
        if (err) {
            res.status(401).send('Access Denied');
            return;
        }
        req.params.userId = payload._id;
        next();
    });
};
exports.authMiddleware = authMiddleware;
exports.default = {
    register,
    login,
    refresh,
    authMiddleware: exports.authMiddleware,
    googleCallback,
    logout
};
//# sourceMappingURL=auth_controller.js.map