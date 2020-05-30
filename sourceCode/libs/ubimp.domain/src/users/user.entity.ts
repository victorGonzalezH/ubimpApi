import { Document } from 'mongoose';

export interface User {
    id: string;
    username: string;
    password: string;
}
