import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import userModel from '../models/Users';
import '../config/passport'; // Ensure your passport config is executed

jest.mock('../models/Users'); // Mock the user model

describe('Passport Google Strategy', () => {
  // Now the google strategy should be registered.
  const googleStrategy = (passport as any)._strategy('google') as any;

  // Dummy values for testing
  const dummyAccessToken = 'dummyAccessToken';
  const dummyRefreshToken = 'dummyRefreshToken';
  const dummyProfile: Profile = {
    id: 'google123',
    displayName: 'Test User',
    name: { familyName: 'User', givenName: 'Test' },
    emails: [{ value: 'test@example.com' }],
    photos: [{ value: 'http://example.com/photo.jpg' }],
    provider: 'google',
  } as Profile;

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return existing user if found by googleId', async () => {
    const existingUser = { id: 'user1', googleId: dummyProfile.id };
    // Simulate finding user by googleId
    (userModel.findOne as jest.Mock).mockResolvedValueOnce(existingUser);

    const done = jest.fn();
    await googleStrategy._verify(dummyAccessToken, dummyRefreshToken, dummyProfile, done);

    expect(userModel.findOne).toHaveBeenCalledWith({ googleId: dummyProfile.id });
    expect(done).toHaveBeenCalledWith(null, existingUser);
  });

  test('should update an existing user (found by email) if not found by googleId', async () => {
    const userWithoutGoogleId = {
      id: 'user2',
      email: dummyProfile.emails![0].value,
      googleId: undefined,
      save: jest.fn().mockResolvedValue(true),
    };

    // First lookup by googleId returns null, then lookup by email returns a user without googleId.
    (userModel.findOne as jest.Mock)
      .mockResolvedValueOnce(null) // lookup by { googleId: dummyProfile.id }
      .mockResolvedValueOnce(userWithoutGoogleId); // lookup by { email: dummyProfile.emails![0].value }

    const done = jest.fn();
    await googleStrategy._verify(dummyAccessToken, dummyRefreshToken, dummyProfile, done);

    // Expect the user to be updated with googleId and saved
    expect(userWithoutGoogleId.googleId).toBe(dummyProfile.id);
    expect(userWithoutGoogleId.save).toHaveBeenCalled();
    expect(userModel.findOne).toHaveBeenCalledWith({ googleId: dummyProfile.id });
    expect(userModel.findOne).toHaveBeenCalledWith({ email: dummyProfile.emails![0].value });
    expect(done).toHaveBeenCalledWith(null, userWithoutGoogleId);
  });

  test('should create a new user if not found by googleId or email', async () => {
    // Both lookups return null
    (userModel.findOne as jest.Mock)
      .mockResolvedValueOnce(null) // for { googleId: dummyProfile.id }
      .mockResolvedValueOnce(null);  // for { email: dummyProfile.emails![0].value }

    // When creating a new user, simulate the constructor behavior.
    const newUserSave = jest.fn().mockResolvedValue(true);
    (userModel as any).mockImplementation(function (userData: any) {
      return { ...userData, save: newUserSave };
    });

    const done = jest.fn();
    await googleStrategy._verify(dummyAccessToken, dummyRefreshToken, dummyProfile, done);

    // Retrieve the created user from the done callback
    const createdUser = done.mock.calls[0][1];
    expect(createdUser.googleId).toBe(dummyProfile.id);
    expect(createdUser.username).toBe(dummyProfile.displayName);
    expect(createdUser.email).toBe(dummyProfile.emails![0].value);
    expect(newUserSave).toHaveBeenCalled();
    expect(done).toHaveBeenCalledWith(null, createdUser);
  });
});

describe('Passport serializeUser and deserializeUser', () => {
  test('serializeUser should call done with user id', (done) => {
    const dummyUser = { id: 'user123' };
    passport.serializeUser(dummyUser, (err, id) => {
      expect(err).toBeNull();
      expect(id).toBe(dummyUser.id);
      done();
    });
  });

  test('deserializeUser should return the user from id', (done) => {
    const dummyUser = { id: 'user123' };
    // Simulate a found user for the given id
    (userModel.findById as jest.Mock).mockResolvedValueOnce(dummyUser);

    passport.deserializeUser(dummyUser.id, (err, user) => {
      expect(err).toBeNull();
      expect(user).toEqual(dummyUser);
      done();
    });
  });
});
