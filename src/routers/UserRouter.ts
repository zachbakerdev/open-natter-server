import * as argon2 from "argon2";
import express from "express";
import strings from "../constants/strings";
import Registration from "../database/models/Registration.model";
import Token from "../database/models/Token.model";
import User from "../database/models/User.model";
import UserVerificationEmail from "../database/models/UserVerificationEmail.model";
import logger from "../util/logger";
import { sendVerificationEmail } from "../util/mailer";

const UserRouter = express.Router();

const USERNAME_REGEX = /^[A-Za-z][A-Za-z0-9_]{1,28}[A-Za-z0-9]$/;
const EMAIL_REGEX =
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
const PASSWORD_LOWERCASE = /^.*[a-z].*$/;
const PASSWORD_UPPERCASE = /^.*[A-Z].*$/;
const PASSWORD_NUMBER = /^.*[0-9].*$/;
const PASSWORD_SPECIAL_CHARACTER =
    /^.*[ !"#$%&'()*+,-.\/:;<=>?@[\\\]^_`{|}~].*$/;
const PASSWORD_COMPLETE =
    /^[ !"#$%&'()*+,-.\/:;<=>?@[\\\]^_`{|}~A-Za-z0-9]{8,}$/;

const { NATTER_ALLOW_PUBLIC_REGISTER, NATTER_ADMIN_EMAIL } = process.env;

const isUserAllowedToRegister = async (email: string): Promise<boolean> => {
    if (NATTER_ALLOW_PUBLIC_REGISTER) true;
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
            userUuid: user.uuid,
        });
        await sendVerificationEmail(user.email, verification.uuid);

        res.status(200).json({ msg: strings.register_success });
    } catch (err) {
        logger.error(err, "registration error");
        res.status(500).json({ msg: strings.internal_server_error });
    }
});

UserRouter.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const isEmail: boolean = EMAIL_REGEX.test(username);

        const user: User | null = await (isEmail
            ? User.findOne({ where: { email: username } })
            : User.findOne({ where: { username } }));

        if (User === null)
            return res.status(403).json({ msg: strings.invalid_login });

        const hashed_password: string = user!.password;
        const isPasswordCorrect: boolean = await argon2.verify(
            hashed_password,
            password,
        );
        if (!isPasswordCorrect)
            return res.status(403).json({ msg: strings.invalid_login });

        // Verify email verified
        if (!user!.email_verified)
            return res.status(403).json({ msg: strings.verify_email });

        // Create login token
        const token = await Token.create({ userUuid: user!.uuid });

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

UserRouter.post("/verify", async (req, res) => {
    try {
        const { key }: { key?: string } = req.params;

        if (!key) return res.status(400).json({ msg: strings.bad_request });

        const verificationEmail: UserVerificationEmail | null =
            await UserVerificationEmail.findOne({
                where: { uuid: key },
            });

        if (verificationEmail === null)
            return res
                .status(404)
                .json({ msg: strings.invalid_verification_key });

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

export default UserRouter;
