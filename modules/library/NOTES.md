Old propagate funcion

  propagate(name, target, ...args) {
    const event = "/" + target.path.map(o => o.id).join("/");
    const path = [target, ...target.path.slice(0, -1).toReversed()];
    let propagationStopped = false;

    for (const currentTarget of path) {
      if (propagationStopped) break;

      if (currentTarget.watchers?.[name]) {
        for (const pattern in currentTarget.watchers[name]) {
          if (this.match(pattern, event)) {
            let immediatePropagationStopped = false;

            for (const callback of currentTarget.watchers[name][pattern]) {
              if (immediatePropagationStopped) break;

              const packet = {
                event,
                target,
                currentTarget,
                stopPropagation: () => {
                  propagationStopped = true;
                },
                stopImmediatePropagation: () => {
                  propagationStopped = true;
                  immediatePropagationStopped = true;
                }
              };

              callback.bind(currentTarget)(packet);
            }
          }
        }
      }
    }
  }
