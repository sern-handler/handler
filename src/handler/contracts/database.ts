import type { ScopedPlugin } from '../../types/handler';

export interface Database extends ScopedPlugin {
    create() : void;
    read() : void;
    update() : void;
    delete() : void;
}

interface DatabaseConstructor  {
    new() : Database
}