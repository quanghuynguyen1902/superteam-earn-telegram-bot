import { Telegraf } from 'telegraf';
import { BotContext } from '../index';
import { setupStartCommand } from './start';
import { setupPreferencesCommands } from './preferences';
import { setupHelpCommand } from './help';
import { setupStopCommand } from './stop';
import { setupStatusCommand } from './status';

export const setupCommands = (bot: Telegraf<BotContext>): void => {
  setupStartCommand(bot);
  setupHelpCommand(bot);
  setupPreferencesCommands(bot);
  setupStatusCommand(bot);
  setupStopCommand(bot);
};