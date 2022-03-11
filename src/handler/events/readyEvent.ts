import { concatMap, first, fromEvent, pipe, tap } from "rxjs";
import * as Files from '../utilities/readFile';
import type Wrapper from '../structures/wrapper';

export const onReady = ( wrapper : Wrapper ) => {
    const { client, init, commands, } = wrapper;
    fromEvent(client, 'ready')
       .pipe(
           first(),
           tap(() => init?.( wrapper ) ),
           concatMap( 
                pipe( 
                  () => Files.buildData(commands),
                )
            ),  
        )
       .subscribe();
}
async function createCommandCache( ) {

}
