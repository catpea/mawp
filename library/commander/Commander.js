const commandModules = new Map();

// Response object factory
class CommandResponse {

  static success(command, result) {
    return {
      status: 'success',
      command,
      result,
      timestamp: new Date().toISOString(),
    };
  }

  static error(command, message) {
    return {
      status: 'error',
      command,
      message,
      timestamp: new Date().toISOString(),
    };
  }

}

// Command loader
class CommandLoader {

  static async load(instanceName) {
    const className = instanceName.charAt(0).toUpperCase() + instanceName.slice(1);
    if (commandModules.has(className)) return commandModules.get(className);

    const commandPath = `./commands/${className}.js`;
    try {
      const CommandModule = await import(commandPath);
      commandModules.set(className, CommandModule.default);
      return CommandModule.default;
    } catch (error) {
      console.log(error)
      if (this.isModuleLoadError(error)) {
        return null;
      }
      throw error;
    }
  }

  static isModuleLoadError(error) {
    const moduleErrorPatterns = [
      'Failed to fetch',
      'Error loading',
      'Cannot find module'
    ];

    return moduleErrorPatterns.some(pattern =>
      error.message.includes(pattern)
    );
  }
}

// Command executor
class CommandExecutor {
  static async execute(model, CommandClass, args) {
    const command = new CommandClass(model);
    return await command.execute(...args);
  }
}

// Command handler
class CommandHandler {
  static async handle(commander, model, commandName, commandArguments) {
    const CommandClass = await CommandLoader.load(commandName);

    if (!CommandClass) {
      return CommandResponse.error(commandName, 'COMMAND NOT FOUND');
    }

    try {
      const result = await CommandExecutor.execute(model, CommandClass, commandArguments);
      commander.emit('executed', {
        timestamp: new Date().toISOString(),
        commandName,
        commandArguments,
        result,
      })
      return CommandResponse.success(commandName, result);
    } catch (error) {
      console.error(error);
      return CommandResponse.error(commandName, error.message);
    }
  }
}


class CommandEmitter {
  constructor() {
    this.events = new Map();
  }

  // Add a listener for an event
  on(eventName, listener) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName).push(listener);
    return () => this.off(eventName, listener);
  }

  // Remove a listener for an event
  off(eventName, listenerToRemove) {
    if (!this.events.has(eventName)) return;
    const listeners = this.events.get(eventName);
    const filteredListeners = listeners.filter(listener => listener !== listenerToRemove);
    if (filteredListeners.length === 0) {
      this.events.delete(eventName);
    } else {
      this.events.set(eventName, filteredListeners);
    }
  }

  // Emit an event with data
  emit(eventName, ...args) {
    if (!this.events.has(eventName)) return;
    const listeners = this.events.get(eventName);
    listeners.forEach(listener => {
      listener(...args);
    });
  }

  // Add a one-time listener
  once(eventName, listener) {
    const onceWrapper = (...args) => {
      this.off(eventName, onceWrapper);
      listener(...args);
    };
    return this.on(eventName, onceWrapper);
  }

  // Get all listeners for an event
  listeners(eventName) {
    return this.events.get(eventName) || [];
  }

}

// Main Commander class
export default class Commander extends CommandEmitter {
  constructor(model) {
    super()
    return new Proxy(this, {
      get: (target, commandName) => {
        // Return actual properties/methods that exist on Commander
        if (commandName in target) {
          return target[commandName];
        }

        // Return command execution handler
        return async (...args) => {
          return await CommandHandler.handle(this, model, commandName, args);
        };
      }
    });
  }
}
