import {User} from "shared";
import {Request} from 'express'

export interface Context {
    readonly user?: User;
    readonly req: Request
}