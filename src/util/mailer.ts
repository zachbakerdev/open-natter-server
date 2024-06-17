import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import logger from "./logger";

const {
    NATTER_MAIL_ENABLED,
    NATTER_MAIL_HOST,
    NATTER_MAIL_PORT,
    NATTER_MAIL_USER,
    NATTER_MAIL_PASS,
} = process.env;

if (NATTER_MAIL_ENABLED === "true") {
    if (!NATTER_MAIL_HOST || !NATTER_MAIL_USER || !NATTER_MAIL_PASS) {
        logger.fatal("Invalid mail environemnt configuration");
        process.exit(1);
    }
} else {
    logger.warn("No mail configuration specified: no emails will be sent");
}

const transporter = NATTER_MAIL_ENABLED ? nodemailer.createTransport(
    {
        host: NATTER_MAIL_HOST,
        port: Number(NATTER_MAIL_PORT),
        auth: {
            user: NATTER_MAIL_USER,
            pass: NATTER_MAIL_PASS,
        },
    },
    {
        from: NATTER_MAIL_USER,
    },
) : null;

transporter
    ?.verify()
    .then(() => {
        logger.info("Mailer initialized and verified");
    })
    .catch((err) => {
        logger.fatal(err, "Mailer failed to verify");
        process.exit(1);
    });

export const sendVerificationEmail = (
    email: string,
    code: string,
): Promise<SMTPTransport.SentMessageInfo> | null => {
    if (!NATTER_MAIL_ENABLED) {
        logger.warn({ email, code }, "Could not send verification email");
        return null;
    }
    return transporter!.sendMail({
        to: email,
        subject: "Open Natter Email verification",
        html: `<h1>Your Verification Code is ${code}`,
    });
};

export default transporter;
