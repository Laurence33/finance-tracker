import { HttpStatus } from 'ft-common-layer';

export class NotFoundException extends Error {
    statusCode = HttpStatus.NOT_FOUND;
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundException';
    }
}

export class BadRequestException extends Error {
    statusCode = HttpStatus.BAD_REQUEST;
    constructor(message: string) {
        super(message);
        this.name = 'BadRequestException';
    }
}
