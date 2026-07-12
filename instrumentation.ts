export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Background worker registration belongs here. Kept intentionally empty
    // until the first monitored evidence source is introduced.
  }
}
