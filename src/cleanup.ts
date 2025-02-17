// It's this package but without default console log / error https://github.com/trevorr/async-cleanup

/** A possibly asynchronous function invoked with the process is about to exit. */
export type CleanupListener = () => void | Promise<void>;

let cleanupListeners: Set<CleanupListener> | undefined;

/** Registers a new cleanup listener. Adding the same listener more than once has no effect. */
export function addCleanupListener(listener: CleanupListener): void {
  // Install exit listeners on initial cleanup listener
  if (!cleanupListeners) {
    installExitListeners();
    cleanupListeners = new Set();
  }

  cleanupListeners.add(listener);
}

/** Removes an existing cleanup listener, and returns whether the listener was registered. */
export function removeCleanupListener(listener: CleanupListener): boolean {
  return cleanupListeners != null && cleanupListeners.delete(listener);
}

/** Executes all cleanup listeners and then exits the process. Call this instead of `process.exit` to ensure all listeners are fully executed. */
export async function exitAfterCleanup(code = 0): Promise<never> {
  await executeCleanupListeners();
  process.exit(code);
}

/** Executes all cleanup listeners and then kills the process with the given signal. */
export async function killAfterCleanup(signal: ExitSignal): Promise<void> {
  await executeCleanupListeners();
  process.kill(process.pid, signal);
}

async function executeCleanupListeners(): Promise<void> {
  if (cleanupListeners) {
    // Remove exit listeners to restore normal event handling
    uninstallExitListeners();

    // Clear cleanup listeners to reset state for testing
    const listeners = cleanupListeners;
    cleanupListeners = undefined;

    // Call listeners in order added with async listeners running concurrently
    const promises: Promise<void>[] = [];
    for (const listener of listeners) {
      try {
        const promise = listener();
        if (promise) promises.push(promise);
      } catch (err) {
        // console.error("Uncaught exception during cleanup", err);
      }
    }

    // Wait for all listeners to complete and log any rejections
    const results = await Promise.allSettled(promises);
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("Unhandled rejection during cleanup", result.reason);
      }
    }
  }
}

function beforeExitListener(code: number): void {
  // console.log(`Exiting with code ${code} due to empty event loop`);
  void exitAfterCleanup(code);
}

function uncaughtExceptionListener(error: Error): void {
  // console.error("Exiting with code 1 due to uncaught exception", error);
  void exitAfterCleanup(1);
}

function signalListener(signal: ExitSignal): void {
  // console.log(`Exiting due to signal ${signal}`);
  void killAfterCleanup(signal);
}

// Listenable signals that terminate the process by default
// (except SIGQUIT, which generates a core dump and should not trigger cleanup)
// See https://nodejs.org/api/process.html#signal-events
const listenedSignals = [
  "SIGBREAK", // Ctrl-Break on Windows
  "SIGHUP", // Parent terminal closed
  "SIGINT", // Terminal interrupt, usually by Ctrl-C
  "SIGTERM", // Graceful termination
  "SIGUSR2", // Used by Nodemon
] as const;

/** Signals that can terminate the process. */
export type ExitSignal =
  | typeof listenedSignals[number]
  | "SIGKILL"
  | "SIGQUIT"
  | "SIGSTOP";

function installExitListeners(): void {
  process.on("beforeExit", beforeExitListener);
  process.on("uncaughtException", uncaughtExceptionListener);
  listenedSignals.forEach((signal) => process.on(signal, signalListener));
}

function uninstallExitListeners(): void {
  process.removeListener("beforeExit", beforeExitListener);
  process.removeListener("uncaughtException", uncaughtExceptionListener);
  listenedSignals.forEach((signal) =>
    process.removeListener(signal, signalListener)
  );
}
