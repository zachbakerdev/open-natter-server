import { NextFunction, Request, Response } from "express";
import strings from "../constants/strings";
import Token from "../database/models/Token.model";
import User from "../database/models/User.model";

export interface AuthenticatedRequest extends Request {
    token: Token;
    user: User;
}

const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const auth = req.header("Authorization");
    const token = await Token.findOne({ where: { uuid: auth } });
    if (token === null)
        return res.status(401).json({ msg: strings.unauthorized });
    if (token.user === null)
        return res.status(401).json({ msg: strings.unauthorized });

    (req as AuthenticatedRequest).token = token;
    (req as AuthenticatedRequest).user = token.user;
    return next();
};

export default authenticate;
