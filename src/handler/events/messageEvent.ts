import type { Message } from 'discord.js';
import type Wrapper from '../structures/wrapper';

import { fromEvent, Observable, of, concatMap } from 'rxjs';

import Context from '../structures/context';
import * as Files from '../utilities/readFile';

import { fmt } from '../utilities/messageHelpers';
import { CommandType } from '../sern';
import { filterTap, ignoreNonBot } from './observableHandling';

export const onMessageCreate = (wrapper: Wrapper) => {
  const { client, defaultPrefix } = wrapper;
  
  (<Observable<Message>>fromEvent(client, 'messageCreate'))
    .pipe(
      ignoreNonBot(defaultPrefix),
      concatMap(m => {
        const [prefix, ...data] = fmt({ msg: m, prefix: defaultPrefix });
        const posMod = Files.Commands.get(prefix) ?? Files.Alias.get(prefix);

        return of(posMod)
          .pipe(
              filterTap(CommandType.TEXT, mod => {
                const ctx = Context.wrap(m);
                mod.execute(ctx, ['text', data]);
              })
            );
          })
      ).subscribe({
          error(e) {
            // Log the errors
              
            throw e;
        },
        next(command) {
          // Log on each command emitted 
          
          console.log(command);
        },
      });
};
