import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";

import User from "../db/models/User.js";

import HttpError from "../helpers/HttpError.js";

import { generateToken } from "../helpers/jwt.js";

// const {JWT_SECRET} = process.env;

export const findUser = query => User.findOne({
    where: query,
})

export const signupUser = async data => {
    const {email, password} = data;
    const user = await User.findOne({
        where: {
            email
        }
    });

    if(user) {
        throw HttpError(409, "Email already in use");
    }

    const hashPassword = await bcrypt.hash(password, 10);

    return User.create({...data, password: hashPassword});
}

export const signinUser = async data => {
    const {email, password} = data;
    const user = await User.findOne({
        where: {
            email
        }
    });
    
    if(!user) {
        throw HttpError(401, "Email or password invalid");
    }

    const passwordCompare = await bcrypt.compare(password, user.password);
    if(!passwordCompare) {
        throw HttpError(401, "Email or password invalid");
    }

    const payload = {
        email
    };

    const token = generateToken(payload);

    await user.update({token});

    // const token = jwt.sign(payload, JWT_SECRET, {
    //     expiresIn: "24h"
    // });

    return {
        user: {
            email,
            username: user.username,
        },
        token,
    };
}

export const logoutUser = async id => {
    const user = await findUser({id});
    if(!user || !user.token) {
        throw HttpError(404, "User not found");
    }

    await user.update({token: null});
}