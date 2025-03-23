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
const Users_1 = __importDefault(require("../models/Users"));
require("../config/passport"); // Ensure your passport config is executed
jest.mock('../models/Users'); // Mock the user model
describe('Passport Google Strategy', () => {
    // Now the google strategy should be registered.
    const googleStrategy = passport_1.default._strategy('google');
    // Dummy values for testing
    const dummyAccessToken = 'dummyAccessToken';
    const dummyRefreshToken = 'dummyRefreshToken';
    const dummyProfile = {
        id: 'google123',
        displayName: 'Test User',
        name: { familyName: 'User', givenName: 'Test' },
        emails: [{ value: 'test@example.com' }],
        photos: [{ value: 'http://example.com/photo.jpg' }],
        provider: 'google',
    };
    afterEach(() => {
        jest.clearAllMocks();
    });
    test('should return existing user if found by googleId', () => __awaiter(void 0, void 0, void 0, function* () {
        const existingUser = { id: 'user1', googleId: dummyProfile.id };
        // Simulate finding user by googleId
        Users_1.default.findOne.mockResolvedValueOnce(existingUser);
        const done = jest.fn();
        yield googleStrategy._verify(dummyAccessToken, dummyRefreshToken, dummyProfile, done);
        expect(Users_1.default.findOne).toHaveBeenCalledWith({ googleId: dummyProfile.id });
        expect(done).toHaveBeenCalledWith(null, existingUser);
    }));
    test('should update an existing user (found by email) if not found by googleId', () => __awaiter(void 0, void 0, void 0, function* () {
        const userWithoutGoogleId = {
            id: 'user2',
            email: dummyProfile.emails[0].value,
            googleId: undefined,
            save: jest.fn().mockResolvedValue(true),
        };
        // First lookup by googleId returns null, then lookup by email returns a user without googleId.
        Users_1.default.findOne
            .mockResolvedValueOnce(null) // lookup by { googleId: dummyProfile.id }
            .mockResolvedValueOnce(userWithoutGoogleId); // lookup by { email: dummyProfile.emails![0].value }
        const done = jest.fn();
        yield googleStrategy._verify(dummyAccessToken, dummyRefreshToken, dummyProfile, done);
        // Expect the user to be updated with googleId and saved
        expect(userWithoutGoogleId.googleId).toBe(dummyProfile.id);
        expect(userWithoutGoogleId.save).toHaveBeenCalled();
        expect(Users_1.default.findOne).toHaveBeenCalledWith({ googleId: dummyProfile.id });
        expect(Users_1.default.findOne).toHaveBeenCalledWith({ email: dummyProfile.emails[0].value });
        expect(done).toHaveBeenCalledWith(null, userWithoutGoogleId);
    }));
    test('should create a new user if not found by googleId or email', () => __awaiter(void 0, void 0, void 0, function* () {
        // Both lookups return null
        Users_1.default.findOne
            .mockResolvedValueOnce(null) // for { googleId: dummyProfile.id }
            .mockResolvedValueOnce(null); // for { email: dummyProfile.emails![0].value }
        // When creating a new user, simulate the constructor behavior.
        const newUserSave = jest.fn().mockResolvedValue(true);
        Users_1.default.mockImplementation(function (userData) {
            return Object.assign(Object.assign({}, userData), { save: newUserSave });
        });
        const done = jest.fn();
        yield googleStrategy._verify(dummyAccessToken, dummyRefreshToken, dummyProfile, done);
        // Retrieve the created user from the done callback
        const createdUser = done.mock.calls[0][1];
        expect(createdUser.googleId).toBe(dummyProfile.id);
        expect(createdUser.username).toBe(dummyProfile.displayName);
        expect(createdUser.email).toBe(dummyProfile.emails[0].value);
        expect(newUserSave).toHaveBeenCalled();
        expect(done).toHaveBeenCalledWith(null, createdUser);
    }));
});
describe('Passport serializeUser and deserializeUser', () => {
    test('serializeUser should call done with user id', (done) => {
        const dummyUser = { id: 'user123' };
        passport_1.default.serializeUser(dummyUser, (err, id) => {
            expect(err).toBeNull();
            expect(id).toBe(dummyUser.id);
            done();
        });
    });
    test('deserializeUser should return the user from id', (done) => {
        const dummyUser = { id: 'user123' };
        // Simulate a found user for the given id
        Users_1.default.findById.mockResolvedValueOnce(dummyUser);
        passport_1.default.deserializeUser(dummyUser.id, (err, user) => {
            expect(err).toBeNull();
            expect(user).toEqual(dummyUser);
            done();
        });
    });
});
//# sourceMappingURL=passport.test.js.map