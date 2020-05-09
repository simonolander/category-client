import {UserInputError} from "apollo-server-express";

class NotFoundError extends UserInputError {
    constructor(id: string, resourceType: string) {
        super(`Resource not found: ${resourceType} ${id}`);
    }
}

export class CategoryNotFoundError extends NotFoundError {
    constructor(id: string) {
        super(id, "Category");
    }
}
export class CategoryItemNotFoundError extends NotFoundError {
    constructor(id: string) {
        super(id, "Category");
    }
}
export class GameNotFoundError extends NotFoundError {
    constructor(id: string) {
        super(id, "Game");
    }
}
export class GuessNotFoundError extends NotFoundError {
    constructor(id: string) {
        super(id, "Guess");
    }
}
export class UserNotFoundError extends NotFoundError {
    constructor(id: string) {
        super(id, "User");
    }
}