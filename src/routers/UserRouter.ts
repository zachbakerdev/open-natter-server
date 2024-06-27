import { generateSecret, validateToken } from "@sunknudsen/totp";
import * as argon2 from "argon2";
import express from "express";
import strings from "../constants/strings";
import Registration from "../database/models/Registration.model";
import Token from "../database/models/Token.model";
import User from "../database/models/User.model";
import UserVerificationEmail from "../database/models/UserVerificationEmail.model";
import authenticate, { AuthenticatedRequest } from "../middleware/authenticate";
import generateEmailCode from "../util/generateEmailCode";
import logger from "../util/logger";
import { sendVerificationEmail } from "../util/mailer";

const UserRouter = express.Router();

const USERNAME_REGEX = /^[A-Za-z]\w{1,28}[A-Za-z0-9]$/;
const EMAIL_REGEX =
    /^[-!#$%&'*+/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
const PASSWORD_LOWERCASE = /^.*[a-z].*$/;
const PASSWORD_UPPERCASE = /^.*[A-Z].*$/;
const PASSWORD_NUMBER = /^.*\d.*$/;
const PASSWORD_SPECIAL_CHARACTER =
    /^.*[ !"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~].*$/;
const PASSWORD_COMPLETE =
    /^[ !"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~A-Za-z0-9]{8,}$/;

const { NATTER_ALLOW_PUBLIC_REGISTER, NATTER_ADMIN_EMAIL } = process.env;

const isUserAllowedToRegister = async (email: string): Promise<boolean> => {
    if (NATTER_ALLOW_PUBLIC_REGISTER) return true;
    if (NATTER_ADMIN_EMAIL === email) return true;
    const registration = await Registration.findOne({ where: { email } });
    return registration !== null;
};

const isUserAllowedAdmin = async (email: string): Promise<boolean> => {
    if (email === NATTER_ADMIN_EMAIL) return true;
    const registration = await Registration.findOne({ where: { email } });
    if (registration === null) return false;
    return registration.admin;
};

UserRouter.post("/register", async (req, res) => {
    // 200 400 403 409 500
    try {
        const { username, email, password } = req.body;

        if (!USERNAME_REGEX.test(username)) {
            return res.status(400).json({ msg: strings.invalid_username });
        }

        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ msg: strings.invalid_email });
        }

        let passwordValid = true;
        if (!PASSWORD_COMPLETE.test(password)) passwordValid = false;
        if (!PASSWORD_LOWERCASE.test(password)) passwordValid = false;
        if (!PASSWORD_UPPERCASE.test(password)) passwordValid = false;
        if (!PASSWORD_NUMBER.test(password)) passwordValid = false;
        if (!PASSWORD_SPECIAL_CHARACTER.test(password)) passwordValid = false;
        if (!passwordValid) {
            return res.status(400).json({ msg: strings.invalid_password });
        }

        if ((await User.findOne({ where: { username } })) !== null) {
            return res.status(409).json({ msg: strings.username_taken });
        }
        if ((await User.findOne({ where: { email } })) !== null) {
            return res.status(409).json({ msg: strings.email_used });
        }

        if (!(await isUserAllowedToRegister(email)))
            return res.status(403).json({ msg: strings.email_not_allowed });

        const isAdmin = await isUserAllowedAdmin(email);
        const hashed_password = await argon2.hash(password, {
            type: argon2.argon2id,
        });
        const user = await User.create({
            username,
            email,
            password: hashed_password,
            isSystemAdmin: isAdmin,
        });

        const verification = await UserVerificationEmail.create({
            code: generateEmailCode(),
            userUuid: user.uuid,
        });
        await sendVerificationEmail(user.email, verification.code);

        res.status(200).json({ msg: strings.register_success, verification: verification.uuid });
    } catch (err) {
        logger.error(err, "registration error");
        res.status(500).json({ msg: strings.internal_server_error });
    }
});

UserRouter.post("/login", async (req, res) => {
    // 200 403 500
    try {
        const { username, password } = req.body;

        if (!username || !password)
            return res.status(400).json({msg: strings.bad_request});

        const isEmail: boolean = EMAIL_REGEX.test(username);

        const user: User | null = await (isEmail
            ? User.findOne({ where: { email: username }, include: [UserVerificationEmail] })
            : User.findOne({ where: { username }, include: [UserVerificationEmail] }));

        if (user === null)
            return res.status(403).json({ msg: strings.invalid_login });

        const hashed_password: string = user.password;
        const isPasswordCorrect: boolean = await argon2.verify(
            hashed_password,
            password,
        );
        if (!isPasswordCorrect)
            return res.status(403).json({ msg: strings.invalid_login });

        // Verify email verified
        if (!user.email_verified)
            return res.status(403).json({ msg: strings.verify_email, verification: user?.verificationEmail.uuid });

        // Create login token
        const token = await Token.create({ userUuid: user.uuid });

        // Send token
        return res.status(200).json({
            msg: strings.login_success,
            token: token.uuid,
        });
    } catch (err) {
        logger.error(err, "login error");
        res.status(500).json({ msg: strings.internal_server_error });
    }
});

UserRouter.post("/register/verify", async (req, res) => {
    // 200 400 403 404 500
    try {
        const { verification, code } = req.body;

        if (!verification) return res.status(400).json({ msg: strings.bad_request });

        const verificationEmail: UserVerificationEmail | null =
            await UserVerificationEmail.findOne({
                where: { uuid: verification },
                include: [User]
            });

        if (verificationEmail === null)
            return res
                .status(404)
                .json({ msg: strings.invalid_verification_key });

        // Check codes match
        if (verificationEmail.code !== code)
            return res
                .status(403)
                .json({ msg: strings.invalid_verification_code });

        // Mark user as verified and delete verification email
        const user = verificationEmail.user;
        user.email_verified = true;
        await user.save();
        await verificationEmail.destroy();

        res.status(200).json({ msg: strings.verified_successfully });
    } catch (err) {
        logger.error(err, "verify error");
        res.status(500).json({ msg: strings.internal_server_error });
    }
});

UserRouter.post("/register/resend_email", async (req, res) => {
    // 200 400 404 500
    try {
        const { verification } = req.body;

        if (!verification) return res.status(400).json({ msg: strings.bad_request });

        const verificationEmail: UserVerificationEmail | null = await UserVerificationEmail.findOne({ where: { uuid: verification }, include: [User] });

        if (verificationEmail === null)
            return res.status(404).json({msg: strings.not_found});

        verificationEmail.code = generateEmailCode();

        await sendVerificationEmail(verificationEmail.user.email, verificationEmail.code);

        await verificationEmail.save();

        return res.status(200).json({msg: strings.email_resent});
    } catch (err) {
        logger.error(err, "resend email error");
        res.status(500).json({msg: strings.internal_server_error});
    }
});

UserRouter.post("/enable_2fa", authenticate, async (req, res) => {
    // 202 409 500
    try {
        const user = (req as AuthenticatedRequest).user;

        if (user.two_factor_authentication_enabled)
            return res.status(409).json({msg: strings.two_factor_already_enabled});

        user.two_factor_authentication_secret = generateSecret();
        await user.save();

        res.status(202).json({msg: strings.verify_enable_2fa, secret: user.two_factor_authentication_secret});
    } catch (err) {
        logger.error(err, "enable 2fa error");
        res.status(500).json({msg: strings.internal_server_error});
    }
});

UserRouter.post("/enable_2fa/verify", authenticate, async (req, res) => {
    // 200 400 403 409 500
    try {
        const user = (req as AuthenticatedRequest).user;

        if (user.two_factor_authentication_enabled)
            return res.status(409).json({msg: strings.two_factor_already_enabled});

        if (!user.two_factor_authentication_secret)
            return res.status(400).json({msg: strings.generate_2fa_first});

        const {code} = req.body;

        if (!code)
            return res.status(400).json({msg: strings.missing_2fa_code});

        const isCodeValid = validateToken(user.two_factor_authentication_secret, code);

        if (!isCodeValid)
            return res.status(403).json({msg: strings.invalid_2fa});

        user.two_factor_authentication_enabled = true;
        await user.save();

        res.status(200).json({msg: strings.two_factor_enabled});
    } catch (err) {
        logger.error(err, "verify enable 2fa error");
        res.status(500).json({msg: strings.internal_server_error});
    }
});

UserRouter.post("/disable_2fa", authenticate, async (req, res) => {
    // 200 403 409 500
    try {
        const user = (req as AuthenticatedRequest).user;

        if (!user.two_factor_authentication_enabled || !user.two_factor_authentication_secret)
            return res.status(409).json({msg: strings.two_factor_already_disabled})

        const {code} = req.body;

        if (!code)
            return res.status(400).json({msg: strings.missing_2fa_code});

        const isCodeValid = validateToken(user.two_factor_authentication_secret, code);

        if (!isCodeValid)
            return res.status(403).json({msg: strings.invalid_2fa});

        user.two_factor_authentication_enabled = false;
        user.two_factor_authentication_secret = null;
        await user.save();

        return res.status(200).json({msg: strings.two_factor_disabled})
    } catch (err) {
        logger.error(err, "disable 2fa error");
        res.status(500).json({msg: strings.internal_server_error});
    }
});

export default UserRouter;
