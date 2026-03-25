import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval('clear expired cache', { hours: 6 }, internal.cache.clearExpired);

export default crons;
