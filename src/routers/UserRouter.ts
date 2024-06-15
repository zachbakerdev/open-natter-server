import { argon2id, hash } from "argon2";
import express from "express";
import strings from "../constants/strings";
import { User } from "../database/sequelize";
import logger from "../util/logger";

const UserRouter = express.Router();

// Must start with a letter
// Must only be alphanumeric and underscores
// Must not end with an underscore
const USERNAME_REGEX = /^[A-Za-z][A-Za-z0-9_]{1,28}[A-Za-z0-9]$/;
// Must be a valid email address
const EMAIL_REGEX =
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
const PASSWORD_LOWERCASE = /^.*[a-z].*$/;
const PASSWORD_UPPERCASE = /^.*[A-Z].*$/;
const PASSWORD_NUMBER = /^.*[0-9].*$/;
const PASSWORD_SPECIAL_CHARACTER =
    /^.*[ !"#$%&'()*+,-.\/:;<=>?@[\\\]^_`{|}~].*$/;
const PASSWORD_COMPLETE =
    /^[ !"#$%&'()*+,-.\/:;<=>?@[\\\]^_`{|}~A-Za-z0-9]{8,}$/;

// User registration
UserRouter.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate username requirements
        if (!USERNAME_REGEX.test(username)) {
            return res.status(400).json({ msg: strings.invalid_username });
        }
        // Validate email requirements
        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ msg: strings.invalid_email });
        }
        // Validate password requirements
        let passwordValid = true;
        if (!PASSWORD_COMPLETE.test(password)) passwordValid = false;
        if (!PASSWORD_LOWERCASE.test(password)) passwordValid = false;
        if (!PASSWORD_UPPERCASE.test(password)) passwordValid = false;
        if (!PASSWORD_NUMBER.test(password)) passwordValid = false;
        if (!PASSWORD_SPECIAL_CHARACTER.test(password)) passwordValid = false;
        if (!passwordValid) {
            return res.status(400).json({ msg: strings.invalid_password });
        }

        // Validate username and email are free
        if ((await User.findOne({ where: { username } })) !== null) {
            return res.status(409).json({ msg: strings.username_taken });
        }
        if ((await User.findOne({ where: { email } })) !== null) {
            return res.status(409).json({ msg: strings.email_used });
        }

        // Generate hash
        const hashed_password = await hash(password, { type: argon2id });

        // Create user
        await User.create({
            username,
            email,
            password: hashed_password,
        });

        // Return success
        res.status(200).json({ msg: strings.register_success });
    } catch (err) {
        logger.error(err, "registration error");
        res.status(500).json({ msg: strings.internal_server_error });
    }
});

export default UserRouter;
