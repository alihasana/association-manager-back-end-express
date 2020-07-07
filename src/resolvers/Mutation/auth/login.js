import {LoginValidator} from "../../../schemas";
import knex from "../../../sql";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import _ from "lodash";

export default async (parent, {email, password}, {req}) => {
    const validate = LoginValidator.validate({email, password}, {abortEarly: false});
    if(validate.error) {
        let error = {
            code: 401,
            message: validate.error.details
        };
        throw  new Error(JSON.stringify(error));

    }
    const user = await knex('user').select("*").where({email: email});
    if (user.length === 0) {
        throw new Error('No user found');
    }

    let hashedPassword = user[0].password.replace('$2y$', '$2a$');
    const valid = await bcrypt.compare(password, hashedPassword);
    if (!valid) {
        throw new Error('Incorrect password');
    }
    req.shoppingUser = true;

    // token = '12083098123414aslkjdasldf.asdhfaskjdh12982u793.asdlfjlaskdj10283491'
    // verify: needs secret | use me for authentication
    // decode: no secret | use me on the client side
    return jwt.sign(
        {
            user: _.pick(user, ['id', 'username']),
        },
        process.env.SECRET,
        {
            expiresIn: '1y',
        },
    );
}
