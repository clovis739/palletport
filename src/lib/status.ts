// Copy for every status screen, keyed by HTTP status code.
export type StatusCopy = { title: string; message: string; tone: "info" | "warn" | "error" };

export const STATUS: Record<number, StatusCopy> = {
  400: { title: "That request didn't look right", message: "Something in the link or form was malformed. Go back and try again.", tone: "warn" },
  401: { title: "Sign in to continue", message: "You need an account to see this page. It only takes a minute to create one.", tone: "info" },
  403: { title: "You don't have access to this page", message: "Your account doesn't have permission to view it. If you think this is a mistake, contact support.", tone: "warn" },
  404: { title: "This pallet fell off the truck", message: "The page you're looking for doesn't exist, was moved, or the lot was removed.", tone: "info" },
  408: { title: "That took too long", message: "The server didn't respond in time. Check your connection and try again.", tone: "warn" },
  410: { title: "This lot is gone", message: "It sold out or was removed. Browse similar lots in stock.", tone: "info" },
  419: { title: "Your session expired", message: "For your security we signed you out after a period of inactivity. Sign in again to pick up where you left off.", tone: "info" },
  429: { title: "Slow down a little", message: "We received a lot of requests from you in a short time. Wait a minute, then try again.", tone: "warn" },
  500: { title: "Something went wrong on our side", message: "An unexpected error stopped this page from loading. Our team has been notified. Try again in a moment.", tone: "error" },
  502: { title: "We couldn't reach a service we depend on", message: "A partner system (payments or freight) didn't respond. Please try again shortly.", tone: "error" },
  503: { title: "We're doing some maintenance", message: "The store is briefly offline while we make improvements.", tone: "info" },
  504: { title: "A service took too long to answer", message: "Something upstream timed out. Try again in a few moments.", tone: "error" },
};

export function statusCopy(code: number): StatusCopy {
  return STATUS[code] ?? (code >= 500 ? STATUS[500] : STATUS[400]);
}
