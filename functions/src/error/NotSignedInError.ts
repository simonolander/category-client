import {AuthenticationError} from "apollo-server-express";

export class NotSignedInError extends AuthenticationError {
    constructor() {
        super("You need to be authenticated to perform this action. Verify your authorization header.");
    }
}