import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import userModel from '../models/Users';
import dotenv from 'dotenv';

dotenv.config();
console.log("🔹 Passport configuration initialized.");

passport.serializeUser((user: any, done) => {
  console.log("🔹 Serializing user:", user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  console.log("🔹 Deserializing user:", id);
  try {
    const user = await userModel.findById(id);
    done(null, user);
  } catch (err) {
    done(err, false);
  }
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: "http://localhost:3000/auth/google/callback"
},
  async (accessToken, refreshToken, profile: Profile, done) => {
    try {
      console.log("🔹 Google OAuth authentication started.");
      console.log("🔹 User Profile:", profile);

      const email = profile.emails?.[0]?.value;
      let username = profile.displayName?.trim();

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
      let user = await userModel.findOne({ email });

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

        await user.save();
        return done(null, user);
      }

      // 📌 **אם המשתמש לא קיים - ניצור חדש**
      const newUser = new userModel({
        username,
        email,
        googleId: profile.id,
        profilePicture: profile.photos?.[0]?.value,
      });

      console.log("🔹 Creating new user:", newUser);
      await newUser.save();
      console.log("🔹 New user created:", newUser.email);
      done(null, newUser);
      
    } catch (err) {
      console.error("🔹 Google OAuth Error:", err);
      done(err, false);
    }
  }
));